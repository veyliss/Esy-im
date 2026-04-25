# 前端 API 接入指南

本文档用于替代并收敛 [`FRONTEND_API_INTEGRATION.md`](im-frontend/FRONTEND_API_INTEGRATION.md)，作为 [`im-frontend`](im-frontend) 当前唯一长期有效的前端接口接入说明。

## 1. 文档目标

本文件聚焦“当前仍然有效的接入规则”，不再保留一次性示例堆叠和历史错误配置。

覆盖范围：
- 环境变量约定
- HTTP 客户端与鉴权流程
- WebSocket 接入规则
- 页面侧调用约束
- 常见错误处理原则

不覆盖：
- 页面视觉方案
- 阶段性联调总结
- 历史错误排查全过程

---

## 2. 当前接入基线

当前前端接入的核心文件如下：
- [`lib/http.ts`](im-frontend/lib/http.ts)
- [`lib/store.ts`](im-frontend/lib/store.ts)
- [`lib/utils/errors.ts`](im-frontend/lib/utils/errors.ts)
- [`lib/websocket/client.ts`](im-frontend/lib/websocket/client.ts)
- [`lib/api/auth.ts`](im-frontend/lib/api/auth.ts)
- [`lib/api/user.ts`](im-frontend/lib/api/user.ts)
- [`lib/api/friend.ts`](im-frontend/lib/api/friend.ts)
- [`lib/api/group.ts`](im-frontend/lib/api/group.ts)
- [`lib/api/message.ts`](im-frontend/lib/api/message.ts)
- [`lib/api/moment.ts`](im-frontend/lib/api/moment.ts)

类型定义集中在：
- [`lib/types/api.ts`](im-frontend/lib/types/api.ts)

---

## 3. 环境变量规范

当前前端应统一使用以下环境变量：

```env
NEXT_PUBLIC_API_BASE=http://localhost:8090/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8090/api/v1
```

说明：
- API 与 WebSocket 必须分开配置
- 不允许再把 WebSocket 地址复用为 HTTP 地址
- 若后端端口变化，优先修改 [`im-frontend/.env.local`](im-frontend/.env.local)

---

## 4. HTTP 接入规则

## 4.1 HTTP 客户端

统一入口：[`lib/http.ts`](im-frontend/lib/http.ts)

职责：
- 统一 `baseURL`
- 自动注入 token
- 统一响应结构处理
- 统一错误转译与重新登录判断

所有页面禁止：
- 直接在页面内创建新的 axios 实例
- 绕过 [`lib/http.ts`](im-frontend/lib/http.ts) 直接拼接完整后端地址

## 4.2 token 注入

token 来源：[`lib/store.ts`](im-frontend/lib/store.ts)

规则：
- 页面不直接拼接 `Authorization`
- token 注入由拦截器负责
- 页面只关心登录成功后调用 `setToken()`

## 4.3 重新登录规则

统一错误判断在：[`lib/utils/errors.ts`](im-frontend/lib/utils/errors.ts)

要求：
- 只允许真正的未授权或 token 失效触发重新登录
- 普通业务错误不得触发清 token
- 页面内不得私自复制未授权判断逻辑

---

## 5. WebSocket 接入规则

统一入口：[`lib/websocket/client.ts`](im-frontend/lib/websocket/client.ts)

规则：
- 连接地址只来自 `NEXT_PUBLIC_WS_URL`
- 连接建立与断开状态应在页面中以弱提示显示
- 页面不直接管理底层 socket 实例细节
- 消息订阅与取消订阅必须放在 `useEffect` 生命周期中成对出现

推荐参考页面：
- [`app/chat/page.tsx`](im-frontend/app/chat/page.tsx)

---

## 6. API 模块使用规则

各业务域必须通过 `lib/api` 下的模块调用：

- 认证：[`lib/api/auth.ts`](im-frontend/lib/api/auth.ts)
- 用户：[`lib/api/user.ts`](im-frontend/lib/api/user.ts)
- 好友：[`lib/api/friend.ts`](im-frontend/lib/api/friend.ts)
- 群组：[`lib/api/group.ts`](im-frontend/lib/api/group.ts)
- 消息：[`lib/api/message.ts`](im-frontend/lib/api/message.ts)
- 朋友圈：[`lib/api/moment.ts`](im-frontend/lib/api/moment.ts)

页面禁止：
- 直接手写接口路径字符串
- 在多个页面中重复封装同一接口
- 在页面中直接处理原始响应结构而不经过统一 API 模块

---

## 7. 页面接入约束

## 7.1 登录页

参考：[`app/login/page.tsx`](im-frontend/app/login/page.tsx)

规则：
- 登录成功后只设置 token 与跳转
- 当前用户信息校验应通过既有鉴权接口完成
- 不应在登录页堆叠额外业务逻辑

## 7.2 聊天页

参考：[`app/chat/page.tsx`](im-frontend/app/chat/page.tsx)

规则：
- 会话列表、消息列表、未读数分别通过业务 API 加载
- WebSocket 负责实时增量，HTTP 负责初始与补偿加载
- 页面不得把实时消息逻辑和视觉结构进一步耦合

## 7.3 通讯录、群聊、朋友圈、我的

参考：
- [`app/contacts/page.tsx`](im-frontend/app/contacts/page.tsx)
- [`app/groups/page.tsx`](im-frontend/app/groups/page.tsx)
- [`app/moments/page.tsx`](im-frontend/app/moments/page.tsx)
- [`app/me/page.tsx`](im-frontend/app/me/page.tsx)

规则：
- 一律通过既有 API 模块与 store 协作
- 视觉重构期间不应顺手改接口协议
- 若发现接口不稳定，应记录到总方案而不是页面内临时规避

---

## 8. 错误处理规则

统一错误工具：[`lib/utils/errors.ts`](im-frontend/lib/utils/errors.ts)

页面建议遵循：
1. `handleApiError()` 负责把未知错误转为统一错误对象
2. `createUserFriendlyErrorMessage()` 负责面向用户的提示文案
3. 网络错误与 WebSocket 错误应做差异化提示
4. 页面不应长期保留硬编码错误提示逻辑

---

## 9. 状态管理规则

认证状态统一入口：[`lib/store.ts`](im-frontend/lib/store.ts)

业务域状态入口：
- [`lib/store/chat.ts`](im-frontend/lib/store/chat.ts)
- [`lib/store/contact.ts`](im-frontend/lib/store/contact.ts)
- [`lib/store/group.ts`](im-frontend/lib/store/group.ts)
- [`lib/store/moment.ts`](im-frontend/lib/store/moment.ts)

约束：
- store 保存共享状态
- 页面负责视图拼装
- API 模块负责网络调用
- 不允许页面同时承担三者职责

---

## 10. 当前已知历史问题结论

以下历史问题已经有明确结论，后续文档不再重复展开：

### 10.1 端口不一致
- 前端历史上曾错误连接到 `8080`
- 当前后端实际端口为 `8090`
- 以后以 [`im-frontend/.env.local`](im-frontend/.env.local) 为准

### 10.2 WebSocket 地址错误
- 历史上曾错误复用 API base
- 当前必须单独使用 `NEXT_PUBLIC_WS_URL`

### 10.3 误登出问题
- 历史问题源于未授权判断过宽
- 当前以 [`lib/utils/errors.ts`](im-frontend/lib/utils/errors.ts) 中统一逻辑为准

### 10.4 浏览器扩展噪音
- `bootstrap-autofill-overlay.js` 类报错不作为业务根因
- 仅作为浏览器扩展兼容噪音看待

---

## 11. 与其他文档的关系

- 总方案：[`PROJECT_REFACTOR_MASTER_PLAN.md`](PROJECT_REFACTOR_MASTER_PLAN.md)
- 前端索引：[`DOCUMENTATION_INDEX.md`](im-frontend/DOCUMENTATION_INDEX.md)
- 前端重构架构：[`FRONTEND_REFACTOR_ARCHITECTURE.md`](im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md)
- 历史接入文档：[`FRONTEND_API_INTEGRATION.md`](im-frontend/FRONTEND_API_INTEGRATION.md)

后续以前端当前接入规则为准时，应优先阅读本文件，而不是历史接入文档。
