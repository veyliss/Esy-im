# 数据库迁移指南

## 概述

本文档说明如何应用数据库索引优化和其他架构改进。

## 自动迁移（推荐）

GORM会自动处理模型变更，包括索引的创建和更新。

### 方法1: 使用现有的AutoMigrate

项目已经在初始化时使用了AutoMigrate，新的索引会自动创建：

```go
// 在 internal/pkg/db.go 中
DB.AutoMigrate(&model.User{}, &model.Friend{}, &model.FriendRequest{}, ...)
```

**重启应用即可应用索引优化**

### 方法2: 创建迁移脚本

如果需要更精细的控制，可以创建专门的迁移脚本：

```bash
cd /Users/xiaoxi/Documents/Project/Esy-IM/im-backend
go run cmd/migrate/main.go
```

## 手动迁移（可选）

如果需要手动执行SQL，可以使用以下脚本：

### User表索引

```sql
-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_id ON users(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email ON users(email) WHERE deleted_at IS NULL;

-- 创建普通索引
CREATE INDEX IF NOT EXISTS idx_nickname ON users(nickname) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_deleted_at ON users(deleted_at);
```

### Friend表索引

```sql
-- 创建唯一复合索引（防止重复好友关系）
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_friend ON friends(user_id, friend_id) WHERE deleted_at IS NULL;

-- 创建单列索引
CREATE INDEX IF NOT EXISTS idx_user ON friends(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_friend ON friends(friend_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_created_at ON friends(created_at);
CREATE INDEX IF NOT EXISTS idx_deleted_at ON friends(deleted_at);
```

### FriendRequest表索引

```sql
-- 创建复合索引
CREATE INDEX IF NOT EXISTS idx_from_to ON friend_requests(from_user_id, to_user_id) WHERE deleted_at IS NULL;

-- 创建单列索引
CREATE INDEX IF NOT EXISTS idx_from_user ON friend_requests(from_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_to_user ON friend_requests(to_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_status ON friend_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_created_at ON friend_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_deleted_at ON friend_requests(deleted_at);
```

### Conversation表索引

```sql
-- 创建唯一复合索引（防止重复会话）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users ON conversations(user1_id, user2_id) WHERE deleted_at IS NULL;

-- 创建单列索引
CREATE INDEX IF NOT EXISTS idx_last_message ON conversations(last_message_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_last_message_time ON conversations(last_message_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_deleted_at ON conversations(deleted_at);
```

### Message表索引

```sql
-- 创建单列索引
CREATE INDEX IF NOT EXISTS idx_conversation ON messages(conversation_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_from_user ON messages(from_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_to_user ON messages(to_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_type ON messages(message_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_is_read ON messages(is_read) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_is_recalled ON messages(is_recalled) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_deleted_at ON messages(deleted_at);
```

### Moment表索引

```sql
-- 创建单列索引
CREATE INDEX IF NOT EXISTS idx_user ON moments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visible ON moments(visible) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_created_at ON moments(created_at);
CREATE INDEX IF NOT EXISTS idx_deleted_at ON moments(deleted_at);
```

### MomentLike表索引

```sql
-- 创建唯一复合索引（防止重复点赞）
CREATE UNIQUE INDEX IF NOT EXISTS idx_moment_user ON moment_likes(moment_id, user_id) WHERE deleted_at IS NULL;

-- 创建单列索引
CREATE INDEX IF NOT EXISTS idx_moment ON moment_likes(moment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user ON moment_likes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_created_at ON moment_likes(created_at);
CREATE INDEX IF NOT EXISTS idx_deleted_at ON moment_likes(deleted_at);
```

### MomentComment表索引

```sql
-- 创建单列索引
CREATE INDEX IF NOT EXISTS idx_moment ON moment_comments(moment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user ON moment_comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reply_to ON moment_comments(reply_to_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_created_at ON moment_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_deleted_at ON moment_comments(deleted_at);
```

## 验证索引创建

### 查看所有索引

```sql
-- PostgreSQL
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;
```

### 查看特定表的索引

```sql
-- 查看users表的索引
SELECT * FROM pg_indexes WHERE tablename = 'users';

-- 查看friends表的索引
SELECT * FROM pg_indexes WHERE tablename = 'friends';
```

### 分析索引使用情况

```sql
-- 查看索引统计信息
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM
    pg_stat_user_indexes
WHERE
    schemaname = 'public'
ORDER BY
    idx_scan DESC;
```

## 性能测试

### 测试查询性能

在应用索引前后运行以下查询，比较性能：

```sql
-- 1. 好友列表查询
EXPLAIN ANALYZE
SELECT * FROM friends WHERE user_id = 'test_user_001' AND deleted_at IS NULL;

-- 2. 消息历史查询
EXPLAIN ANALYZE
SELECT * FROM messages 
WHERE conversation_id = 1 
  AND deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 50;

-- 3. 朋友圈时间线查询
EXPLAIN ANALYZE
SELECT * FROM moments 
WHERE user_id IN ('user1', 'user2', 'user3') 
  AND deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 20;

-- 4. 未读消息统计
EXPLAIN ANALYZE
SELECT COUNT(*) FROM messages 
WHERE to_user_id = 'test_user_001' 
  AND is_read = false 
  AND deleted_at IS NULL;
```

## 回滚索引（如需要）

如果索引导致问题，可以删除：

```sql
-- 删除特定索引
DROP INDEX IF EXISTS idx_user_id;
DROP INDEX IF EXISTS idx_email;
-- ... 其他索引

-- 或批量删除（谨慎使用）
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') 
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
    END LOOP;
END $$;
```

## 注意事项

1. **索引创建时间**: 对于大表，索引创建可能需要一些时间
2. **并发创建**: 使用 `CREATE INDEX CONCURRENTLY` 可以避免锁表
3. **磁盘空间**: 索引会占用额外的磁盘空间
4. **写入性能**: 索引会轻微降低插入和更新性能
5. **定期维护**: 定期运行 `VACUUM ANALYZE` 优化索引

## 迁移检查清单

- [ ] 备份数据库
- [ ] 在测试环境验证迁移
- [ ] 检查磁盘空间是否充足
- [ ] 执行迁移（自动或手动）
- [ ] 验证索引创建成功
- [ ] 运行性能测试
- [ ] 监控应用性能
- [ ] 更新文档

## 故障排查

### 索引未创建

检查GORM日志，确认AutoMigrate是否执行成功：

```go
// 启用GORM日志
DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
    Logger: logger.Default.LogMode(logger.Info),
})
```

### 性能未提升

1. 检查查询是否使用了索引（使用EXPLAIN ANALYZE）
2. 确认查询条件与索引列匹配
3. 检查是否存在表锁或其他性能问题
4. 运行 `VACUUM ANALYZE` 更新统计信息

## 联系支持

如遇到问题，请查看：
- GORM文档: https://gorm.io/docs/migration.html
- PostgreSQL索引文档: https://www.postgresql.org/docs/current/indexes.html
