package main

import (
	"log"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"

	"github.com/joho/godotenv"
)

func main() {
	// 自动加载 .env
	_ = godotenv.Load(".env")

	host := os.Getenv("SMTP_HOST")
	portStr := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")

	if host == "" || portStr == "" || user == "" || pass == "" {
		log.Fatal("❌ SMTP 环境变量缺失，请检查 .env 文件")
	}

	port, _ := strconv.Atoi(portStr)

	m := gomail.NewMessage()
	m.SetHeader("From", user)
	m.SetHeader("To", "2760439882@qq.com") // ⚠️ 改成收件人
	m.SetHeader("Subject", "测试邮件")
	m.SetBody("text/plain", "这是一封来自 Go 的测试邮件")

	d := gomail.NewDialer(host, port, user, pass)
	d.SSL = false // 587 端口使用 STARTTLS

	if err := d.DialAndSend(m); err != nil {
		log.Println("❌ 邮件发送失败:", err)
		return
	}

	log.Println("✅ 邮件发送成功")
}
