import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { UserRoutes } from './routers/user';
import { RoleRoutes } from './routers/role';

dotenv.config();

class Server {
    app: express.Express = express();

    constructor() {
        this.app.use(express.json());  // 添加这行来解析 JSON 请求体
        this.app.use(bodyParser.urlencoded({ extended: true }));  // 确保这是正确的
        this.app.use(cookieParser());
        this.app.use(cors({
            origin: true,  // 适当更新你的前端地址
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }));
        this.setUpRoutes();
    }

    private setUpRoutes(): void {
        const userRoutes = new UserRoutes();
        const roleRoutes = new RoleRoutes();
        this.app.use('/api/user', userRoutes.router);
        this.app.use('/api/role', roleRoutes.router)
    }

    start(): void {
        this.app.listen(3001, () => {
            console.log('Server is running on port 3001');
        });
    }
}

new Server().start();
