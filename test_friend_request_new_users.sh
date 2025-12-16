#!/bin/bash

# 测试好友请求功能 - 使用新用户
API_URL="http://localhost:8080/api/v1"

echo "=========================================="
echo "测试好友请求功能 - 使用新用户"
echo "=========================================="
echo ""

# 生成唯一的时间戳
TIMESTAMP=$(date +%s)

# 1. 注册用户 TestUser1
echo "1. 注册测试用户 TestUser1..."
USER1_EMAIL="testuser1_${TIMESTAMP}@test.com"
USER1_ID="testuser1_${TIMESTAMP}"
USER1_PWD="12345678"

REGISTER1=$(curl -s -X POST "$API_URL/users/register-pwd" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER1_EMAIL\",
    \"user_id\": \"$USER1_ID\",
    \"nickname\": \"测试用户1\",
    \"password\": \"$USER1_PWD\"
  }")

echo "响应: $REGISTER1"

if echo "$REGISTER1" | grep -q '"code":0'; then
  echo "✅ TestUser1 注册成功"
else
  echo "❌ TestUser1 注册失败"
  exit 1
fi
echo ""

# 2. 注册用户 TestUser2
echo "2. 注册测试用户 TestUser2..."
USER2_EMAIL="testuser2_${TIMESTAMP}@test.com"
USER2_ID="testuser2_${TIMESTAMP}"
USER2_PWD="12345678"

REGISTER2=$(curl -s -X POST "$API_URL/users/register-pwd" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER2_EMAIL\",
    \"user_id\": \"$USER2_ID\",
    \"nickname\": \"测试用户2\",
    \"password\": \"$USER2_PWD\"
  }")

echo "响应: $REGISTER2"

if echo "$REGISTER2" | grep -q '"code":0'; then
  echo "✅ TestUser2 注册成功"
else
  echo "❌ TestUser2 注册失败"
  exit 1
fi
echo ""

sleep 1

# 3. 用户1登录
echo "3. 用户1 登录..."
LOGIN1=$(curl -s -X POST "$API_URL/users/login-pwd" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER1_EMAIL\",
    \"password\": \"$USER1_PWD\"
  }")

TOKEN1=$(echo $LOGIN1 | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN1" ]; then
  echo "❌ 用户1 登录失败"
  echo "响应: $LOGIN1"
  exit 1
fi

echo "✅ 用户1 登录成功"
echo ""

# 4. 用户2登录
echo "4. 用户2 登录..."
LOGIN2=$(curl -s -X POST "$API_URL/users/login-pwd" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER2_EMAIL\",
    \"password\": \"$USER2_PWD\"
  }")

TOKEN2=$(echo $LOGIN2 | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN2" ]; then
  echo "❌ 用户2 登录失败"
  echo "响应: $LOGIN2"
  exit 1
fi

echo "✅ 用户2 登录成功"
echo ""

# 5. 用户1 发送好友请求给 用户2
echo "5. 用户1 发送好友请求给 用户2..."
SEND_REQUEST=$(curl -s -X POST "$API_URL/friends/send-request" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d "{
    \"to_user_id\": \"$USER2_ID\",
    \"message\": \"你好，我是测试用户1，想加你为好友\"
  }")

echo "响应: $SEND_REQUEST"

if echo "$SEND_REQUEST" | grep -q '"code":0'; then
  echo "✅ 好友请求发送成功"
else
  echo "❌ 好友请求发送失败"
  exit 1
fi
echo ""

# 6. 用户2 查看收到的好友请求
echo "6. 用户2 查看收到的好友请求..."
RECEIVED_REQUESTS=$(curl -s -X GET "$API_URL/friends/received-requests?status=0" \
  -H "Authorization: Bearer $TOKEN2")

echo "响应: $RECEIVED_REQUESTS"
echo ""

# 提取请求数量
REQUEST_COUNT=$(echo $RECEIVED_REQUESTS | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
echo "📩 用户2 收到 $REQUEST_COUNT 个待处理的好友请求"

if [ "$REQUEST_COUNT" -gt "0" ]; then
  echo "✅ 用户2 成功收到好友请求！"
else
  echo "❌ 用户2 没有收到好友请求！这是Bug!"
  exit 1
fi
echo ""

# 7. 用户1 查看发出的好友请求
echo "7. 用户1 查看发出的好友请求..."
SENT_REQUESTS=$(curl -s -X GET "$API_URL/friends/sent-requests" \
  -H "Authorization: Bearer $TOKEN1")

echo "响应: $SENT_REQUESTS"
echo ""

# 8. 提取请求ID并接受请求
REQUEST_ID=$(echo $RECEIVED_REQUESTS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$REQUEST_ID" ]; then
  echo "8. 用户2 接受用户1的好友请求 (ID: $REQUEST_ID)..."
  ACCEPT_RESPONSE=$(curl -s -X POST "$API_URL/friends/accept-request" \
    -H "Authorization: Bearer $TOKEN2" \
    -H "Content-Type: application/json" \
    -d "{
      \"request_id\": $REQUEST_ID
    }")
  
  echo "响应: $ACCEPT_RESPONSE"
  
  if echo "$ACCEPT_RESPONSE" | grep -q '"code":0'; then
    echo "✅ 好友请求已接受"
  else
    echo "❌ 接受好友请求失败"
    exit 1
  fi
  echo ""
fi

# 9. 查看双方的好友列表
echo "9. 用户1 的好友列表..."
FRIENDS1=$(curl -s -X GET "$API_URL/friends/list" \
  -H "Authorization: Bearer $TOKEN1")
echo "$FRIENDS1"

FRIEND_COUNT1=$(echo $FRIENDS1 | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
echo "用户1 有 $FRIEND_COUNT1 个好友"
echo ""

echo "10. 用户2 的好友列表..."
FRIENDS2=$(curl -s -X GET "$API_URL/friends/list" \
  -H "Authorization: Bearer $TOKEN2")
echo "$FRIENDS2"

FRIEND_COUNT2=$(echo $FRIENDS2 | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
echo "用户2 有 $FRIEND_COUNT2 个好友"
echo ""

echo "=========================================="
if [ "$REQUEST_COUNT" -gt "0" ] && [ "$FRIEND_COUNT1" -gt "0" ] && [ "$FRIEND_COUNT2" -gt "0" ]; then
  echo "✅ 测试全部通过！好友请求功能正常工作！"
else
  echo "⚠️  测试部分失败，请检查日志"
fi
echo "=========================================="
echo ""
echo "测试用户信息:"
echo "  用户1 ID: $USER1_ID"
echo "  用户1 邮箱: $USER1_EMAIL"
echo "  用户2 ID: $USER2_ID"
echo "  用户2 邮箱: $USER2_EMAIL"
echo "  密码: $USER1_PWD"
