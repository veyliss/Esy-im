# 错误处理使用指南

## 概述

本项目使用统一的错误处理机制，提供一致的错误响应格式和清晰的错误码定义。

## 错误码体系

### 错误码分类

- `0`: 成功
- `4xxx`: 客户端错误和业务错误
- `5xxx`: 服务端错误

### 常用错误码

#### 通用错误 (40xx)

```go
CodeSuccess          = 0     // 成功
CodeBadRequest       = 4001  // 请求参数错误
CodeUnauthorized     = 4002  // 未授权
CodeForbidden        = 4003  // 禁止访问
CodeNotFound         = 4004  // 资源不存在
CodeConflict         = 4009  // 资源冲突
CodeValidationFailed = 4010  // 验证失败
```

#### 用户相关 (41xx)

```go
CodeUserNotFound  = 4101  // 用户不存在
CodeUserExists    = 4102  // 用户已存在
CodeWrongPassword = 4103  // 密码错误
CodeTokenInvalid  = 4104  // Token无效
CodeTokenExpired  = 4105  // Token过期
CodeCodeInvalid   = 4106  // 验证码无效
CodeCodeExpired   = 4107  // 验证码过期
```

#### 好友相关 (42xx)

```go
CodeFriendNotFound = 4201  // 好友不存在
CodeFriendExists   = 4202  // 已经是好友
CodeRequestExists  = 4203  // 好友请求已存在
```

#### 消息相关 (43xx)

```go
CodeMessageNotFound = 4301  // 消息不存在
```

#### 朋友圈相关 (44xx)

```go
CodeMomentNotFound   = 4401  // 朋友圈不存在
CodePermissionDenied = 4403  // 权限不足
```

#### 服务端错误 (50xx)

```go
CodeInternalError = 5000  // 内部服务器错误
CodeDatabaseError = 5001  // 数据库错误
CodeRedisError    = 5002  // Redis错误
CodeEmailError    = 5003  // 邮件发送错误
```

## 使用方法

### 1. 创建应用错误

#### 基础用法

```go
// 创建简单错误
appErr := pkg.NewAppError(pkg.CodeUserNotFound, "用户不存在")

// 创建带原始错误的错误
appErr := pkg.NewAppErrorWithErr(pkg.CodeDatabaseError, "查询失败", err)
```

#### 包装已有错误

```go
user, err := userRepo.FindByEmail(email)
if err != nil {
    // 包装数据库错误
    return pkg.WrapError(err, pkg.CodeDatabaseError, "查询用户失败")
}
```

### 2. 在Handler中使用

#### 方法1: 使用ErrorWithAppError（推荐）

```go
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    userID := pkg.GetUserIDFromContext(r.Context())
    
    user, err := h.service.GetUser(userID)
    if err != nil {
        if appErr, ok := err.(*pkg.AppError); ok {
            pkg.ErrorWithAppError(w, appErr, true)
            return
        }
        
        // 未知错误，使用默认错误码
        appErr := pkg.NewAppErrorWithErr(pkg.CodeInternalError, "获取用户失败", err)
        pkg.ErrorWithAppError(w, appErr, false)
        return
    }
    
    pkg.Success(w, user)
}
```

#### 方法2: 使用HandleError（更简洁）

```go
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    userID := pkg.GetUserIDFromContext(r.Context())
    
    user, err := h.service.GetUser(userID)
    if err != nil {
        // HandleError会自动判断错误类型并处理
        pkg.HandleError(w, err, pkg.CodeInternalError)
        return
    }
    
    pkg.Success(w, user)
}
```

### 3. 在Service层使用

Service层应该返回AppError：

```go
func (s *UserService) GetUser(userID string) (*model.User, error) {
    user, err := s.repo.FindByID(userID)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, pkg.NewAppError(pkg.CodeUserNotFound, "用户不存在")
        }
        return nil, pkg.WrapError(err, pkg.CodeDatabaseError, "查询用户失败")
    }
    
    return user, nil
}
```

### 4. 参数验证错误

```go
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
    var req registerRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        appErr := pkg.NewAppError(pkg.CodeBadRequest, "请求参数格式错误")
        pkg.ErrorWithAppError(w, appErr, false)
        return
    }
    
    // 参数验证
    if req.Email == "" || req.UserID == "" {
        appErr := pkg.NewAppError(pkg.CodeValidationFailed, "email和user_id不能为空")
        pkg.ErrorWithAppError(w, appErr, false)
        return
    }
    
    // ... 业务逻辑
}
```

### 5. 业务逻辑错误

```go
func (s *FriendService) SendRequest(fromUserID, toUserID string) error {
    // 检查是否已经是好友
    isFriend, err := s.repo.IsFriend(fromUserID, toUserID)
    if err != nil {
        return pkg.WrapError(err, pkg.CodeDatabaseError, "检查好友关系失败")
    }
    
    if isFriend {
        return pkg.NewAppError(pkg.CodeFriendExists, "已经是好友关系")
    }
    
    // 检查是否已有待处理的请求
    hasRequest, err := s.repo.HasPendingRequest(fromUserID, toUserID)
    if err != nil {
        return pkg.WrapError(err, pkg.CodeDatabaseError, "检查好友请求失败")
    }
    
    if hasRequest {
        return pkg.NewAppError(pkg.CodeRequestExists, "好友请求已存在")
    }
    
    // ... 创建好友请求
    return nil
}
```

## 响应格式

### 成功响应

```json
{
    "code": 0,
    "msg": "success",
    "data": {
        "user_id": "user001",
        "email": "user@example.com"
    }
}
```

### 错误响应

```json
{
    "code": 4101,
    "msg": "用户不存在",
    "data": null
}
```

### 带详情的错误响应（开发环境）

```json
{
    "code": 5001,
    "msg": "数据库错误: 连接超时",
    "data": null
}
```

## 最佳实践

### 1. 选择合适的错误码

```go
// ✅ 好的做法：使用明确的错误码
if user == nil {
    return pkg.NewAppError(pkg.CodeUserNotFound, "用户不存在")
}

// ❌ 不好的做法：使用通用错误码
if user == nil {
    return pkg.NewAppError(pkg.CodeNotFound, "未找到")
}
```

### 2. 提供有意义的错误详情

```go
// ✅ 好的做法：提供上下文信息
return pkg.NewAppError(pkg.CodeValidationFailed, "email格式不正确")

// ❌ 不好的做法：错误信息过于简单
return pkg.NewAppError(pkg.CodeBadRequest, "错误")
```

### 3. 不暴露敏感信息

```go
// ✅ 好的做法：隐藏内部实现细节
appErr := pkg.WrapError(err, pkg.CodeDatabaseError, "操作失败")
pkg.ErrorWithAppError(w, appErr, false) // showDetail=false

// ❌ 不好的做法：暴露数据库错误详情给客户端
pkg.Error(w, 5000, "database error: "+err.Error())
```

### 4. 记录错误日志

错误处理函数会自动记录日志：

```go
// ErrorWithAppError会自动记录错误日志
appErr := pkg.NewAppErrorWithErr(pkg.CodeDatabaseError, "查询失败", err)
pkg.ErrorWithAppError(w, appErr, true)

// 日志输出示例：
// [Error] Code=5001, Message=数据库错误, Detail=查询失败, Err=connection timeout
```

### 5. 使用错误包装追踪错误链

```go
// Service层
func (s *UserService) UpdateUser(userID string, data map[string]interface{}) error {
    if err := s.repo.Update(userID, data); err != nil {
        // 包装错误，保留原始错误
        return pkg.WrapError(err, pkg.CodeDatabaseError, "更新用户失败")
    }
    return nil
}

// Handler层
func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
    // ...
    if err := h.service.UpdateUser(userID, data); err != nil {
        // HandleError会自动处理AppError
        pkg.HandleError(w, err, pkg.CodeInternalError)
        return
    }
    pkg.Success(w, "更新成功")
}
```

## 迁移现有代码

### 旧代码

```go
if err != nil {
    pkg.Error(w, 4001, "参数错误")
    return
}
```

### 新代码

```go
if err != nil {
    appErr := pkg.NewAppError(pkg.CodeBadRequest, "参数解析失败")
    pkg.ErrorWithAppError(w, appErr, true)
    return
}
```

或更简洁的方式：

```go
if err != nil {
    pkg.HandleError(w, err, pkg.CodeBadRequest)
    return
}
```

## 添加自定义错误码

在 `internal/pkg/errors.go` 中添加：

```go
// 1. 定义错误码
const (
    // ... 现有错误码
    CodeCustomError ErrorCode = 4999  // 自定义错误
)

// 2. 添加错误消息
var errorMessages = map[ErrorCode]string{
    // ... 现有错误消息
    CodeCustomError: "自定义错误消息",
}
```

## 常见问题

### Q: 如何判断某个错误是否是特定的AppError？

```go
if appErr, ok := err.(*pkg.AppError); ok {
    if appErr.Code == pkg.CodeUserNotFound {
        // 处理用户不存在的情况
    }
}
```

### Q: 开发环境和生产环境如何区分错误详情？

```go
// 可以通过环境变量控制
isDev := os.Getenv("ENV") == "development"
pkg.ErrorWithAppError(w, appErr, isDev)
```

### Q: 如何在不同层级传递错误？

```go
// Repository层
func (r *UserRepo) FindByID(id string) (*model.User, error) {
    var user model.User
    err := r.db.First(&user, id).Error
    if err != nil {
        return nil, err  // 返回原始错误
    }
    return &user, nil
}

// Service层
func (s *UserService) GetUser(id string) (*model.User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, pkg.NewAppError(pkg.CodeUserNotFound, "用户不存在")
        }
        return nil, pkg.WrapError(err, pkg.CodeDatabaseError, "查询用户失败")
    }
    return user, nil
}

// Handler层
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    user, err := h.service.GetUser(userID)
    if err != nil {
        pkg.HandleError(w, err, pkg.CodeInternalError)
        return
    }
    pkg.Success(w, user)
}
```

## 参考资料

- [Go Error处理最佳实践](https://go.dev/blog/error-handling-and-go)
- [errors包文档](https://pkg.go.dev/errors)
