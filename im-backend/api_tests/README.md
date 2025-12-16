# IM 后端 API 全面测试套件

本测试套件对IM后端的所有API接口进行全面测试，包括功能测试、参数校验、异常处理和性能测试。

## 测试覆盖范围

### 1. 用户管理模块 (User Management)
- ✅ 健康检查 (`GET /ping`)
- ✅ 密码注册 (`POST /users/register-pwd`)
  - 正常流程
  - 参数校验（缺少必填字段、密码过短等）
  - 重复注册验证
- ✅ 密码登录 (`POST /users/login-pwd`)
  - 正常流程
  - 错误密码
  - 不存在的用户
- ✅ 获取个人信息 (`GET /users/me`)
  - 需要认证
  - 无Token验证
  - 错误Token验证
- ✅ 登出 (`POST /users/logout`)
- ✅ 设置密码 (`POST /users/set-password`)

### 2. 好友关系模块 (Friend Management)
- ✅ 搜索用户 (`GET /friends/search`)
- ✅ 发送好友请求 (`POST /friends/send-request`)
  - 正常流程
  - 参数校验
  - 重复请求处理
- ✅ 获取收到的好友请求 (`GET /friends/received-requests`)
- ✅ 获取发出的好友请求 (`GET /friends/sent-requests`)
- ✅ 接受好友请求 (`POST /friends/accept-request`)
- ✅ 拒绝好友请求 (`POST /friends/reject-request`)
- ✅ 获取好友列表 (`GET /friends/list`)
- ✅ 更新好友备注 (`PUT /friends/update-remark`)
- ✅ 删除好友 (`DELETE /friends/{friend_id}`)

### 3. 朋友圈模块 (Moment Management)
- ✅ 发布朋友圈 (`POST /moments/create`)
  - 正常流程
  - 参数校验
  - 可见范围设置
- ✅ 获取自己的朋友圈列表 (`GET /moments/my-list`)
- ✅ 获取朋友圈动态详情 (`GET /moments/{id}`)
- ✅ 获取朋友圈时间线 (`GET /moments/timeline`)
- ✅ 点赞朋友圈 (`POST /moments/{id}/like`)
- ✅ 取消点赞 (`DELETE /moments/{id}/unlike`)
- ✅ 获取点赞列表 (`GET /moments/{id}/likes`)
- ✅ 评论朋友圈 (`POST /moments/{id}/comment`)
- ✅ 回复评论
- ✅ 获取评论列表 (`GET /moments/{id}/comments`)
- ✅ 删除评论 (`DELETE /moments/comments/{comment_id}`)
- ✅ 删除朋友圈 (`DELETE /moments/{id}`)

### 4. 消息通信模块 (Message Management)
- ✅ 创建会话 (`POST /messages/conversations/create`)
- ✅ 发送消息 (`POST /messages/send`)
  - 文本消息
  - 参数校验
  - 非好友发送验证
- ✅ 获取会话列表 (`GET /messages/conversations`)
- ✅ 获取会话消息历史 (`GET /messages/conversations/{id}/messages`)
- ✅ 获取未读消息总数 (`GET /messages/unread-count`)
- ✅ 标记会话为已读 (`PUT /messages/conversations/{id}/read`)
- ✅ 撤回消息 (`PUT /messages/{id}/recall`)
- ✅ 删除消息 (`DELETE /messages/{id}`)

## 前置条件

### 1. 确保后端服务运行
```bash
cd /Users/xiaoxi/Documents/Project/Esy-IM/im-backend
go run cmd/server/main.go
```

服务应该在 `http://localhost:8080` 上运行。

### 2. 确保数据库和Redis正常运行
- PostgreSQL (localhost:5432)
- Redis (localhost:6379)

## 运行测试

### 运行所有测试
```bash
cd /Users/xiaoxi/Documents/Project/Esy-IM/im-backend/api_tests
go test -v
```

### 运行特定模块测试
```bash
# 只运行用户管理模块测试
go test -v -run TestUserManagement

# 只运行好友关系模块测试
go test -v -run TestFriendManagement

# 只运行朋友圈模块测试
go test -v -run TestMomentManagement

# 只运行消息通信模块测试
go test -v -run TestMessageManagement
```

### 生成详细测试报告
测试完成后会自动生成详细报告文件 `API_TEST_REPORT_YYYYMMDD_HHMMSS.txt`

## 测试报告内容

测试报告包含以下内容：

### 1. 测试概况
- 测试开始/结束时间
- 总耗时
- 测试服务器地址

### 2. 测试统计
- 总测试数
- 通过/失败/跳过的测试数量和百分比

### 3. 模块测试详情
按模块分组显示每个测试的结果和耗时

### 4. 失败测试汇总
列出所有失败的测试及其错误信息

### 5. 性能分析
- 平均响应时间
- 最慢的测试列表

### 6. 测试建议
根据测试结果提供改进建议

### 7. 测试覆盖范围
详细列出所有被测试的API端点

## 测试架构

```
api_tests/
├── test_base.go        # 测试基础设施（HTTP客户端、断言、报告生成）
├── user_test.go        # 用户管理模块测试
├── friend_test.go      # 好友关系模块测试
├── moment_test.go      # 朋友圈模块测试
├── message_test.go     # 消息通信模块测试
└── main_test.go        # 主测试入口和报告生成
```

## 测试特点

### 1. 全面性
- 覆盖所有核心API端点
- 包括正常流程和异常情况
- 参数校验测试
- 权限验证测试

### 2. 独立性
- 每个测试模块独立准备测试数据
- 测试之间互不干扰
- 使用时间戳避免数据冲突

### 3. 可读性
- 清晰的测试命名
- 详细的日志输出
- 友好的报告格式

### 4. 性能监控
- 记录每个测试的耗时
- 识别性能瓶颈
- 提供优化建议

## 测试配置

可以在 `test_base.go` 中修改以下配置：

```go
const (
    BaseURL     = "http://localhost:8080/api/v1"  // 测试服务器地址
    TestTimeout = 30 * time.Second                 // 请求超时时间
)
```

## 常见问题

### Q1: 测试失败怎么办？
1. 检查后端服务是否正常运行
2. 检查数据库和Redis连接
3. 查看后端日志获取详细错误信息
4. 确认.env配置是否正确

### Q2: 如何清理测试数据？
测试会自动使用时间戳创建唯一的测试用户，一般不需要手动清理。
如需清理，可直接清空数据库或使用数据库迁移重置。

### Q3: 为什么有些测试被跳过？
某些测试依赖于前置条件（如需要先创建数据），如果前置条件不满足会被跳过。

### Q4: 如何添加新的测试用例？
1. 在对应模块的测试文件中添加新的测试函数
2. 函数名以 `test` 开头
3. 使用 `AddTestResult()` 记录测试结果
4. 在模块的主测试函数中添加 `t.Run()` 调用

## 性能基准

基于正常网络环境的参考值：

- 用户注册/登录: < 500ms
- 获取列表接口: < 300ms
- 创建/更新操作: < 200ms
- 删除操作: < 150ms

如果测试响应时间显著超过这些值，建议检查：
1. 数据库索引是否正确
2. Redis缓存是否生效
3. 网络连接是否正常

## 持续集成

可将此测试套件集成到CI/CD流程中：

```yaml
# 示例 GitHub Actions 配置
- name: Run API Tests
  run: |
    cd im-backend/api_tests
    go test -v -timeout 10m
```

## 贡献

如发现测试用例不完整或有改进建议，欢迎提交PR或Issue。

## 许可

本测试套件遵循项目主许可协议。
