"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.captcha = exports.register = exports.userList = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const svg_captcha_1 = __importDefault(require("svg-captcha"));
const prisma = new client_1.PrismaClient();
const userList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userList = yield prisma.users.findMany();
    res.status(200).json({ data: userList });
});
exports.userList = userList;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, voice_attachment, role_id } = req.body;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma.users.create({
            data: {
                username,
                password: hashedPassword,
                voice_attachment,
                role_id
            }
        });
        res.status(200).json({ message: "create user success" });
    }
    catch (error) {
        return res.status(500).json({ message: `Register api error: ${error}` });
    }
});
exports.register = register;
// get captcha
const captcha = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const captchaOptions = {
        size: 4, // 验证码长度
        noise: 15, // 噪点数量
        color: true, // 验证码字符是否有颜色
        background: '#cc9966', // 背景颜色
        fontSize: 50, // 文字大小
        ignoreChars: '0o1i', // 排除易混淆的字符
        complexity: 10, // 复杂度，越高越难
    };
    const captcha = svg_captcha_1.default.create(captchaOptions);
    res.cookie("captcha", captcha.text, { httpOnly: true, secure: false });
    // 發送驗證碼
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(captcha.data);
});
exports.captcha = captcha;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, captcha } = req.body;
    try {
        const saveCaptcha = req.cookies["captcha"];
        console.log(saveCaptcha);
        const user = yield prisma.users.findFirst({
            where: { username }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found!!" });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, 'your_secret_key', { expiresIn: '1h' });
        req.session.token = token;
        res.status(200).json({ message: "login success", token });
    }
    catch (error) {
        return res.status(500).json({ message: `login api error: ${error}` });
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (error) {
        return res.status(500).json({ message: `Logout api error ${error}` });
    }
});
exports.logout = logout;
