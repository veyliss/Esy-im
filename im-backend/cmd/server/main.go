package main

import (
	"im-backend/config"
	"im-backend/internal/pkg"
	"im-backend/internal/router"
	"log"
	"net/http"
)

func main() {
	// 统一加载配置
	config.LoadConfig()

	// 初始化依赖
	pkg.InitPostgres()
	pkg.InitRedis()
	pkg.InitHub() // 初始化WebSocket Hub

	// 路由
	r := router.InitRouter()
	// 使用pkg.CORSMiddleware替代rs/cors，避免WebSocket升级问题
	handler := pkg.CORSMiddleware(pkg.LoggingMiddleware(pkg.RecoverMiddleware(r)))

	addr := ":" + config.Cfg.AppPort
	log.Println("🚀 Server running at http://localhost" + addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}
