package pkg

import (
	"context"
	"errors"
	"fmt"
	"im-backend/config"
	"log"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
)

// getJWTSecret 获取JWT密钥
func getJWTSecret() []byte {
	if config.Cfg == nil || config.Cfg.JWTSecret == "" {
		log.Fatal("⚠️ JWT_SECRET 未配置，请在.env文件中设置JWT_SECRET")
	}
	return []byte(config.Cfg.JWTSecret)
}

// getJWTExpiration 获取JWT过期时间
func getJWTExpiration() time.Duration {
	if config.Cfg == nil || config.Cfg.JWTExpiration == 0 {
		return 8 * time.Hour // 默认8小时
	}
	return time.Duration(config.Cfg.JWTExpiration) * time.Hour
}

type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

const tokenPrefix = "jwt:"

// GenerateToken 生成 Token 并写入 Redis
func GenerateToken(email string, rdb *redis.Client) (string, error) {
	expiration := getJWTExpiration()
	claims := Claims{
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// 生成 token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(getJWTSecret())
	if err != nil {
		return "", WrapError(err, CodeInternalError, "JWT生成失败")
	}

	// 存储规则：一个用户只保留一个有效 token
	ctx := context.Background()
	key := fmt.Sprintf("%s%s", tokenPrefix, email)

	// 保存 email -> token
	err = rdb.Set(ctx, key, tokenString, expiration).Err()
	if err != nil {
		return "", WrapError(err, CodeRedisError, "Token存储失败")
	}

	return tokenString, nil
}

// VerifyToken 验证 Token
func VerifyToken(tokenString string, rdb *redis.Client) (*Claims, error) {
	log.Printf("Raw token input: %q", tokenString)

	// 去掉前后空格 & Bearer 前缀
	tokenString = strings.TrimSpace(tokenString)
	if strings.HasPrefix(tokenString, "Bearer ") {
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")
		tokenString = strings.TrimSpace(tokenString)
	}

	// 检查是否是合法 JWT（三段）
	if strings.Count(tokenString, ".") != 2 {
		if strings.Contains(tokenString, "@") {
			log.Printf("[VerifyToken] ⚠️ 收到的 token 实际是 email=%q", tokenString)
			return nil, errors.New("收到的 token 是邮箱而不是 JWT，请检查调用方")
		}
		log.Printf("[VerifyToken] ⚠️ token 格式错误=%q", tokenString)
		return nil, errors.New("token 格式不正确")
	}

	// 解析 JWT
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// 限制必须是 HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return getJWTSecret(), nil
	})
	if err != nil {
		return nil, err
	}

	// 打印 token 的关键信息
	log.Printf("token.Valid: %v\n", token.Valid)
	log.Printf("token.Method: %v\n", token.Method)
	log.Printf("token.Header: %+v\n", token.Header)

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("无效的token")
	}

	// 校验 Redis 中是否匹配
	ctx := context.Background()
	key := fmt.Sprintf("%s%s", tokenPrefix, claims.Email)
	storedToken, err := rdb.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return nil, errors.New("token 已过期，请重新登录")
	} else if err != nil {
		return nil, err
	}

	if storedToken != tokenString {
		return nil, errors.New("token 已失效（可能在其他地方登录）")
	}

	return claims, nil
}

// DeleteToken 删除 Token（登出）
func DeleteToken(userID string, rdb *redis.Client) error {
	ctx := context.Background()
	key := fmt.Sprintf("%s%s", tokenPrefix, userID)
	return rdb.Del(ctx, key).Err()
}
