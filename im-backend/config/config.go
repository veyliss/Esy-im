package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort string

	// 数据库
	PostgresHost     string
	PostgresPort     string
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string

	// Redis
	RedisHost string
	RedisPort string
	RedisDB   int

	// 邮件
	SMTPHost string
	SMTPPort int
	SMTPUser string
	SMTPPass string

	// JWT
	JWTSecret     string
	JWTExpiration int // JWT过期时间（小时）
}

var Cfg *Config

func LoadConfig() {
	// 加载 .env 文件（如果存在）
	_ = godotenv.Load(".env")

	// 转换 Redis DB
	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))
	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))

	// JWT过期时间
	jwtExpiration, _ := strconv.Atoi(getEnv("JWT_EXPIRATION", "8"))

	Cfg = &Config{
		AppPort: os.Getenv("APP_PORT"),

		// postgres sql
		PostgresHost:     getEnv("POSTGRES_HOST", "localhost"),
		PostgresPort:     getEnv("POSTGRES_PORT", "5432"),
		PostgresUser:     getEnv("POSTGRES_USER", "postgres"),
		PostgresPassword: getEnv("POSTGRES_PASSWORD", "password"),
		PostgresDB:       getEnv("POSTGRES_DB", "imdb"),

		// redis
		RedisHost: getEnv("REDIS_HOST", "localhost"),
		RedisPort: getEnv("REDIS_PORT", "6379"),
		RedisDB:   redisDB,

		// 邮箱配置
		SMTPHost: getEnv("SMTP_HOST", "smtp.qq.com"),
		SMTPPort: smtpPort,
		SMTPUser: os.Getenv("SMTP_USER"),
		SMTPPass: os.Getenv("SMTP_PASS"),

		// JWT配置
		JWTSecret:     getEnv("JWT_SECRET", ""),
		JWTExpiration: jwtExpiration,
	}

	log.Println("✅ 配置加载完成")
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
