#!/bin/bash

# 测试用户创建脚本
# 密码统一为: 12345678

API_URL="http://localhost:8080/api/v1"

echo "开始创建测试用户..."
echo "================================"

# 定义测试用户数组
declare -a users=(
  "alice:alice@test.com:爱丽丝"
  "bob:bob@test.com:鲍勃"
  "charlie:charlie@test.com:查理"
  "david:david@test.com:大卫"
  "emma:emma@test.com:艾玛"
)

# 循环创建用户
for user in "${users[@]}"; do
  IFS=':' read -r user_id email nickname <<< "$user"
  
  echo ""
  echo "正在创建用户: $nickname ($user_id)"
  echo "邮箱: $email"
  
  response=$(curl -s -X POST "$API_URL/users/register-pwd" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"user_id\": \"$user_id\",
      \"nickname\": \"$nickname\",
      \"password\": \"12345678\"
    }")
  
  echo "响应: $response"
  
  # 检查是否成功
  if echo "$response" | grep -q '"code":0'; then
    echo "✓ 创建成功"
  else
    echo "✗ 创建失败"
  fi
  
  echo "--------------------------------"
  sleep 0.5
done

echo ""
echo "================================"
echo "用户创建完成!"
echo ""
echo "测试用户列表:"
echo "--------------------------------"
echo "用户ID       | 邮箱              | 昵称   | 密码"
echo "--------------------------------"
echo "alice       | alice@test.com    | 爱丽丝 | 12345678"
echo "bob         | bob@test.com      | 鲍勃   | 12345678"
echo "charlie     | charlie@test.com  | 查理   | 12345678"
echo "david       | david@test.com    | 大卫   | 12345678"
echo "emma        | emma@test.com     | 艾玛   | 12345678"
echo "--------------------------------"
echo ""
echo "登录示例:"
echo "curl -X POST $API_URL/users/login-pwd \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"alice@test.com\", \"password\": \"12345678\"}'"
