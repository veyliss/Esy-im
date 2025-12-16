package pkg

import (
	"fmt"
	"im-backend/config"
	"im-backend/internal/model"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitPostgres() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		config.Cfg.PostgresHost,
		config.Cfg.PostgresPort,
		config.Cfg.PostgresUser,
		config.Cfg.PostgresPassword,
		config.Cfg.PostgresDB,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true, // 禁用自动创建外键约束
	})
	if err != nil {
		log.Fatalf("❌ Postgres 连接失败: %v", err)
	}

	// 自动迁移数据表 - 分步迁移避免外键依赖问题
	// 先创建基础表
	if err := DB.AutoMigrate(&model.User{}); err != nil {
		log.Fatalf("❌ User表迁移失败: %v", err)
	}

	// 创建好友相关表
	if err := DB.AutoMigrate(
		&model.Friend{},
		&model.FriendRequest{},
	); err != nil {
		log.Fatalf("❌ 好友表迁移失败: %v", err)
	}

	// 创建朋友圈相关表
	if err := DB.AutoMigrate(
		&model.Moment{},
		&model.MomentLike{},
		&model.MomentComment{},
	); err != nil {
		log.Fatalf("❌ 朋友圈表迁移失败: %v", err)
	}

	// 创建消息相关表
	if err := DB.AutoMigrate(
		&model.Conversation{},
		&model.Message{},
	); err != nil {
		log.Fatalf("❌ 消息表迁移失败: %v", err)
	}

	log.Println("✅ Postgres 连接成功并完成迁移")
}
