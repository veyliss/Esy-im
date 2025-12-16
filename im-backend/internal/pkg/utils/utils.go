package pkg

import "os"

// GetEnv 获取环境变量，不存在就用默认值
func GetEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
