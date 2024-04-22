"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_1 = require("./routers/user");
dotenv_1.default.config();
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json()); // 添加这行来解析 JSON 请求体
        this.app.use(body_parser_1.default.urlencoded({ extended: true })); // 确保这是正确的
        this.app.use((0, cookie_parser_1.default)());
        this.app.use((0, cors_1.default)({
            origin: 'http://localhost:3000', // 适当更新你的前端地址
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }));
        this.setUpRoutes();
    }
    setUpRoutes() {
        const userRoutes = new user_1.UserRoutes();
        this.app.use('/api/user', userRoutes.router);
    }
    start() {
        this.app.listen(3001, () => {
            console.log('Server is running on port 3001');
        });
    }
}
new Server().start();
