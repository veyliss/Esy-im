package pkg

import (
	"context"
	"fmt"
	"im-backend/config"
	"log"

	"github.com/redis/go-redis/v9"
)

var RDB *redis.Client

func InitRedis() {
	addr := fmt.Sprintf("%s:%s", config.Cfg.RedisHost, config.Cfg.RedisPort)

	RDB = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "",
		DB:       config.Cfg.RedisDB,
	})

	if err := RDB.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("❌ Redis 连接失败: %v", err)
	}
	log.Println("✅ Redis 连接成功:", addr)
}
