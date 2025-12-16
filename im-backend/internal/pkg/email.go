package pkg

import (
	"im-backend/config"
	"log"

	"gopkg.in/gomail.v2"
)

func SendEmail(to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", config.Cfg.SMTPUser)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)

	d := gomail.NewDialer(
		config.Cfg.SMTPHost,
		config.Cfg.SMTPPort,
		config.Cfg.SMTPUser,
		config.Cfg.SMTPPass,
	)
	d.SSL = false

	if err := d.DialAndSend(m); err != nil {
		log.Println("❌ 邮件发送失败:", err)
		return err
	}

	log.Println("✅ 邮件已发送到:", to)
	return nil
}
