package main

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func main() {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379", // 确认 docker 映射
		Password: "",               // 如果有密码就写
		DB:       0,
	})

	ctx := context.Background()
	err := rdb.Set(ctx, "test_key", "hello redis", 0).Err()
	if err != nil {
		fmt.Println("❌ Redis 写入失败:", err)
		return
	}

	val, err := rdb.Get(ctx, "test_key").Result()
	if err != nil {
		fmt.Println("❌ Redis 读取失败:", err)
		return
	}

	fmt.Println("✅ Redis 正常:", val)
}
