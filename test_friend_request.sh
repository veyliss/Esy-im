#!/bin/bash

# 测试好友请求功能
API_URL="http://localhost:8080/api/v1"

echo "=========================================="
echo "测试好友请求功能"
echo "=========================================="
echo ""

# 1. 用户Alice登录
echo "1. 用户 alice 登录..."
ALICE_LOGIN=$(curl -s -X POST "$API_URL/users/login-pwd" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "12345678"
  }')

ALICE_TOKEN=$(echo $ALICE_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ALICE_TOKEN" ]; then
  echo "❌ Alice 登录失败"
  echo "响应: $ALICE_LOGIN"
  exit 1
fi

echo "✅ Alice 登录成功"
echo "Token: ${ALICE_TOKEN:0:30}..."
echo ""

# 2. 用户Bob登录
echo "2. 用户 bob 登录..."
BOB_LOGIN=$(curl -s -X POST "$API_URL/users/login-pwd" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@test.com",
    "password": "12345678"
  }')

BOB_TOKEN=$(echo $BOB_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$BOB_TOKEN" ]; then
  echo "❌ Bob 登录失败"
  echo "响应: $BOB_LOGIN"
  exit 1
fi

echo "✅ Bob 登录成功"
echo "Token: ${BOB_TOKEN:0:30}..."
echo ""

# 3. Alice 发送好友请求给 Bob
echo "3. Alice 发送好友请求给 Bob..."
SEND_REQUEST=$(curl -s -X POST "$API_URL/friends/send-request" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user_id": "bob",
    "message": "你好，我是Alice，想加你为好友"
  }')

echo "响应: $SEND_REQUEST"

if echo "$SEND_REQUEST" | grep -q '"code":0'; then
  echo "✅ 好友请求发送成功"
else
  echo "⚠️  好友请求发送可能失败(可能已经是好友或已发送过请求)"
fi
echo ""

# 4. Bob 查看收到的好友请求
echo "4. Bob 查看收到的好友请求..."
RECEIVED_REQUESTS=$(curl -s -X GET "$API_URL/friends/received-requests?status=0" \
  -H "Authorization: Bearer $BOB_TOKEN")

echo "响应: $RECEIVED_REQUESTS"
echo ""

# 提取请求数量
REQUEST_COUNT=$(echo $RECEIVED_REQUESTS | grep -o '"id":[0-9]*' | wc -l)
echo "Bob 收到 $REQUEST_COUNT 个待处理的好友请求"
echo ""

# 5. Alice 查看发出的好友请求
echo "5. Alice 查看发出的好友请求..."
SENT_REQUESTS=$(curl -s -X GET "$API_URL/friends/sent-requests" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "响应: $SENT_REQUESTS"
echo ""

# 6. 提取请求ID并接受请求(如果有的话)
REQUEST_ID=$(echo $RECEIVED_REQUESTS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$REQUEST_ID" ]; then
  echo "6. Bob 接受 Alice 的好友请求 (ID: $REQUEST_ID)..."
  ACCEPT_RESPONSE=$(curl -s -X POST "$API_URL/friends/accept-request" \
    -H "Authorization: Bearer $BOB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"request_id\": $REQUEST_ID
    }")
  
  echo "响应: $ACCEPT_RESPONSE"
  
  if echo "$ACCEPT_RESPONSE" | grep -q '"code":0'; then
    echo "✅ 好友请求已接受"
  else
    echo "❌ 接受好友请求失败"
  fi
  echo ""
else
  echo "⚠️  没有找到待处理的好友请求"
  echo ""
fi

# 7. 查看双方的好友列表
echo "7. Alice 的好友列表..."
ALICE_FRIENDS=$(curl -s -X GET "$API_URL/friends/list" \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo "$ALICE_FRIENDS"
echo ""

echo "8. Bob 的好友列表..."
BOB_FRIENDS=$(curl -s -X GET "$API_URL/friends/list" \
  -H "Authorization: Bearer $BOB_TOKEN")
echo "$BOB_FRIENDS"
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
