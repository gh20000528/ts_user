# ts_user
# 用戶管理 API

本用戶管理 API 提供了管理用戶、處理身份認證和檢查權限的端點。它支持用戶註冊、登錄、登出以及獲取用戶列表等操作。此 API 是使用 Express.js 和 Prisma ORM 構建的。

## 快速開始

在運行服務器之前，請確保已安裝 Node.js 和 npm。然後，安裝依賴項：

```bash
npm install
啟動服務器：

bash
Copy code
npm start
服務器將運行在 http://localhost:3001。

API 端點
用戶操作
用戶列表
GET /api/user/
描述：獲取所有用戶的列表。
所需權限：無需權限。
請求主體：無。
註冊用戶
POST /api/user/register
描述：註冊新用戶。
所需權限：newUser 權限。
請求主體：
json
Copy code
{
  "username": "string",
  "password": "string",
  "voice_attachment": "boolean",
  "role_id": "number"
}
驗證：
username：非空字符串。
password：非空字符串。
voice_attachment：非空。
role_id：非空。
登錄
POST /api/user/login
描述：認證用戶並返回令牌。
所需權限：無。
請求主體：
json
Copy code
{
  "username": "string",
  "password": "string",
  "captcha": "string",
  "captchaId": "string"
}
登出
POST /api/user/logout
描述：通過使令牌無效來登出用戶。
所需權限：無。
請求主體：無。
驗證碼
獲取驗證碼
GET /api/user/captcha
描述：為登錄表單生成一個驗證碼。
所需權限：無。
請求主體：無。
安全性
此 API 使用 JSON Web Tokens (JWT) 來管理登錄和保護端點。

環境變量
請確保您的 .env 文件包含以下內容：

DATABASE_URL：您的數據庫連接字符串。
錯誤處理
所有端點在失敗時返回適當的 HTTP 狀態碼以及錯誤消息。

開發
此 API 使用 Express.js、Prisma ORM 和多種中間件來處理請求和安全。

Copy code

此 README 文件提供了有關如何使用 API、提供的端點的詳細信息、請求格式和每個端點所需的權限的概述。根據您的 API 的實際實施和配置調整詳細信息。
```