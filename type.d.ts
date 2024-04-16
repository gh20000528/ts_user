// types.d.ts 或任何其他 .d.ts 文件
import 'express-session';

declare module 'express-session' {
  export interface SessionData {
    token?: string;  // 添加 token 屬性
    captcha?: string;
  }
}