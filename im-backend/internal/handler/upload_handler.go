package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
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

// UploadFile 上传通用文件（语音、视频、文档），限制 50MB。
func (h *UploadHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	const maxSize = 50 * 1024 * 1024
	r.Body = http.MaxBytesReader(w, r.Body, maxSize)
	if err := r.ParseMultipartForm(maxSize); err != nil {
		pkg.Error(w, int(pkg.CodeBadRequest), "文件不能超过50MB")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		pkg.Error(w, int(pkg.CodeBadRequest), "请选择要上传的文件")
		return
	}
	defer file.Close()

	// 按子目录分类存储
	contentType := header.Header.Get("Content-Type")
	var subDir string
	switch {
	case strings.HasPrefix(contentType, "audio/"):
		subDir = "audio"
	case strings.HasPrefix(contentType, "video/"):
		subDir = "video"
	default:
		subDir = "files"
	}

	dir := filepath.Join("uploads", subDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		pkg.ServiceError(w, err, pkg.CodeInternalError)
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".dat"
	}
	filename := time.Now().Format("20060102") + "-" + randomHex(8) + ext
	relativePath := filepath.Join(dir, filename)
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

	publicPath := fmt.Sprintf("/uploads/%s/%s", subDir, filename)
	pkg.Success(w, map[string]interface{}{
		"url":      requestBaseURL(r) + publicPath,
		"path":     publicPath,
		"filename": header.Filename,
		"size":     header.Size,
	})
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
