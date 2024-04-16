"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const user_1 = require("./routers/user");
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
// DO NOT WRITE
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.app.use(body_parser_1.default.urlencoded({ extended: true }));
        this.app.use((0, cookie_session_1.default)({ keys: ['laskdjf'] }));
        this.app.use((0, cookie_parser_1.default)());
        this.app.use((0, cors_1.default)({
            origin: 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST']
        }));
        this.app.use((0, express_session_1.default)({
            secret: 'keyboard cat',
            resave: true,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                maxAge: 30000
            }
        }));
        this.setUpRoutes();
    }
    setUpRoutes() {
        const userRoutes = new user_1.UserRoutes();
        this.app.use('/api/user', userRoutes.router);
    }
    start() {
        this.app.listen(3001, () => {
            console.log('Listening on port 3000');
        });
    }
}
new Server().start();
