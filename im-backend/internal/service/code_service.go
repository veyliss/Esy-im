package service

import (
	"context"
	"fmt"
	"im-backend/internal/pkg"
	"math/rand"
	"time"

	"github.com/redis/go-redis/v9"
)

const CodePrefix = "verify_code:"

type CodeService struct{}

func NewCodeService() *CodeService {
	return &CodeService{}
}

// SendCode 生成验证码并发送邮件
func (s *CodeService) SendCode(email string) error {
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	// 保存到 Redis，过期 5 分钟
	ctx := context.Background()
	if err := pkg.RDB.Set(ctx, CodePrefix+email, code, 5*time.Minute).Err(); err != nil {
		return err
	}

	// 发送邮件
	subject := "IM 系统验证码"
	body := fmt.Sprintf("您的验证码是：%s，5分钟内有效。", code)
	return pkg.SendEmail(email, subject, body)
}

// VerifyCode 校验验证码
func (s *CodeService) VerifyCode(email, code string) (bool, error) {
	ctx := context.Background()
	val, err := pkg.RDB.Get(ctx, CodePrefix+email).Result()
	if err == redis.Nil {
		// Redis 没有值（过期或者没发送过）
		return false, nil
	} else if err != nil {
		return false, err
	}
	return val == code, nil
}
