package pkg

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// LoggingMiddleware 记录请求日志和耗时
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// 创建自定义ResponseWriter来捕获状态码
		lrw := &loggingResponseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(lrw, r)

		duration := time.Since(start)
		log.Printf("[%s] %s %s %d %v", r.Method, r.RequestURI, r.RemoteAddr, lrw.statusCode, duration)
	})
}

// loggingResponseWriter 自定义ResponseWriter用于记录状态码
type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}

// Hijack 实现http.Hijacker接口，支持WebSocket升级
func (lrw *loggingResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hijacker, ok := lrw.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, fmt.Errorf("ResponseWriter does not implement http.Hijacker")
	}
	return hijacker.Hijack()
}

// recoverResponseWriter 支持Hijacker接口的recovery响应包装器
type recoverResponseWriter struct {
	http.ResponseWriter
}

// Hijack 实现http.Hijacker接口，支持WebSocket升级
func (rrw *recoverResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hijacker, ok := rrw.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, fmt.Errorf("ResponseWriter does not implement http.Hijacker")
	}
	return hijacker.Hijack()
}

// RecoverMiddleware 捕获 panic 并返回 JSON错误
func RecoverMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rrw := &recoverResponseWriter{ResponseWriter: w}
		defer func() {
			if err := recover(); err != nil {
				log.Printf("🔥 Panic: %v\n%s", err, debug.Stack())

				// 使用统一的错误响应
				appErr := NewAppError(CodeInternalError, "internal server error")
				ErrorWithAppError(rrw, appErr, false) // 不向客户端暴露panic详情
			}
		}()
		next.ServeHTTP(rrw, r)
	})
}

// AuthMiddleware JWT认证中间件
func AuthMiddleware(rdb *redis.Client, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 获取 token
		tokenString := r.Header.Get("Authorization")

		// 去掉前后空格 & Bearer 前缀
		tokenString = strings.TrimSpace(tokenString)
		if strings.HasPrefix(tokenString, "Bearer ") {
			tokenString = strings.TrimPrefix(tokenString, "Bearer ")
			tokenString = strings.TrimSpace(tokenString)
		}

		if tokenString == "" {
			appErr := NewAppError(CodeUnauthorized, "未提供Token")
			ErrorWithAppError(w, appErr, false)
			return
		}

		// 验证 token
		claims, err := VerifyToken(tokenString, rdb)
		if err != nil {
			appErr := WrapError(err, CodeTokenInvalid, "Token无效或过期")
			ErrorWithAppError(w, appErr, false)
			return
		}

		// 把 Email 写入请求上下文
		ctx := r.Context()
		ctx = SetUserIDToContext(ctx, claims.Email)
		r = r.WithContext(ctx)

		next(w, r)
	}
}

// ValidateRequest 请求参数验证中间件
func ValidateRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 验证Content-Type
		if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch {
			contentType := r.Header.Get("Content-Type")
			if !strings.Contains(contentType, "application/json") {
				appErr := NewAppError(CodeBadRequest, "Content-Type必须为application/json")
				ErrorWithAppError(w, appErr, false)
				return
			}
		}
		next(w, r)
	}
}

// CORSMiddleware 跨域请求处理中间件
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "3600")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RateLimitMiddleware 限流中间件（简单实现）
type RateLimiter struct {
	requests map[string][]time.Time
}

func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
	}
}

func (rl *RateLimiter) Middleware(maxRequests int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			now := time.Now()

			// 清理过期记录
			if times, exists := rl.requests[ip]; exists {
				var validTimes []time.Time
				for _, t := range times {
					if now.Sub(t) < window {
						validTimes = append(validTimes, t)
					}
				}
				rl.requests[ip] = validTimes
			}

			// 检查是否超过限制
			if len(rl.requests[ip]) >= maxRequests {
				appErr := NewAppError(CodeForbidden, "请求过于频繁，请稍后再试")
				ErrorWithAppError(w, appErr, false)
				return
			}

			// 记录请求
			rl.requests[ip] = append(rl.requests[ip], now)
			next.ServeHTTP(w, r)
		})
	}
}
