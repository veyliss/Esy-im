package handler

import (
	"crypto/rand"
	"encoding/hex"
	"im-backend/internal/pkg"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func randomHex(size int) string {
	bytes := make([]byte, size)
	if _, err := rand.Read(bytes); err != nil {
		return hex.EncodeToString([]byte(time.Now().Format("20060102150405.000000000")))
	}
	return hex.EncodeToString(bytes)
}

func requestBaseURL(r *http.Request) string {
	scheme := r.Header.Get("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
	}
	return scheme + "://" + r.Host
}

// UploadImage 上传图片，返回可直接访问的图片 URL。
func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 5*1024*1024)
	if err := r.ParseMultipartForm(5 * 1024 * 1024); err != nil {
		pkg.Error(w, int(pkg.CodeBadRequest), "图片不能超过5MB")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		pkg.Error(w, int(pkg.CodeBadRequest), "请选择要上传的图片")
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		pkg.Error(w, int(pkg.CodeBadRequest), "只支持上传图片")
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		switch contentType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/gif":
			ext = ".gif"
		case "image/webp":
			ext = ".webp"
		default:
			ext = ".img"
		}
	}

	if err := os.MkdirAll("uploads/images", 0755); err != nil {
		pkg.ServiceError(w, err, pkg.CodeInternalError)
		return
	}

	filename := time.Now().Format("20060102") + "-" + randomHex(8) + ext
	relativePath := filepath.Join("uploads", "images", filename)
	out, err := os.Create(relativePath)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeInternalError)
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		pkg.ServiceError(w, err, pkg.CodeInternalError)
		return
	}

	publicPath := "/uploads/images/" + filename
	pkg.Success(w, map[string]string{
		"url":  requestBaseURL(r) + publicPath,
		"path": publicPath,
	})
}
