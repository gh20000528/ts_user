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
exports.editPassword = exports.softDeletedUser = exports.userinfo = exports.logout = exports.login = exports.captcha = exports.register = exports.userList = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const svg_captcha_1 = __importDefault(require("svg-captcha"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../tools/logger"));
const prisma = new client_1.PrismaClient();
// all type
var responseStatus;
(function (responseStatus) {
    responseStatus[responseStatus["error"] = 400] = "error";
    responseStatus[responseStatus["not_found"] = 404] = "not_found";
    responseStatus[responseStatus["success"] = 200] = "success";
})(responseStatus || (responseStatus = {}));
// tool function
const captchaStore = {};
const tokenBlack = new Set();
// 清除req雜值
function cleanString(input) {
    return input.replace(/\0/g, '');
}
// valid password
const validpassword = [
    (0, express_validator_1.check)('password')
        .isLength({ min: 8 }).withMessage("密碼要超過八碼")
        .matches(/[a-zA-z]/).withMessage("密碼中要包含至少一個英文字")
        .matches(/\d/).withMessage("密碼中要包含至少一個數字")
];
// api function
// get user list
const userList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userList = yield prisma.users.findMany({
            select: {
                id: true,
                username: true,
                voice_attachment: true,
                password: false,
                role_id: true,
                deleted: true,
                role: {
                    select: {
                        role_name: true
                    }
                }
            }
        });
        const formattedUser = userList.map(user => ({
            id: user.id,
            username: user.username,
            voice_attachment: user.voice_attachment,
            role: user.role_id,
            delete: user.deleted,
            roleName: user.role.role_name
        }));
        logger_1.default.info('fetch user list success');
        res.status(responseStatus.success).json({ data: formattedUser });
    }
    catch (error) {
        logger_1.default.error(`user list api error: ${error}`);
        res.status(responseStatus.error).json({ message: `get user list error ${error}` });
    }
});
exports.userList = userList;
// post register
exports.register = [
    ...validpassword,
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            const { username, password, voice_attachment, role_id } = req.body;
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: "valid error" });
            }
            const parsedRoleId = parseInt(role_id, 10);
            if (isNaN(parsedRoleId)) {
                return res.status(400).json({ message: "Invalid role_id, it must be a number." });
            }
            const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
            const cleanUsername = cleanString(username);
            const cleanPassword = cleanString(password);
            console.log(cleanUsername, cleanPassword);
            yield prisma.users.create({
                data: {
                    username,
                    password: hashedPassword,
                    voice_attachment,
                    role_id: parsedRoleId
                }
            });
            logger_1.default.info(`create user success username: ${username}`);
            res.status(200).json({ message: "create user success" });
        }
        catch (error) {
            logger_1.default.error(`register api error: ${error}`);
            return res.status(500).json({ message: `Register api error: ${error}` });
        }
    })
];
// get captcha
const captcha = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const captchaOptions = {
        size: 4, // 验证码长度
        noise: 5, // 噪点数量
        color: true, // 验证码字符是否有颜色
        background: '#cc9999', // 背景颜色
        fontSize: 70, // 文字大小
        ignoreChars: '0o1it', // 排除易混淆的字符
        width: 200,
        height: 80,
        complexity: 10, // 复杂度，越高越难
    };
    const captcha = svg_captcha_1.default.create(captchaOptions);
    const captcha_id = (0, uuid_1.v4)();
    captchaStore[captcha_id] = {
        captcha: captcha.text,
        expires: new Date(Date.now() + 60000)
    };
    logger_1.default.info("get captcha success");
    res.status(200).json({ captcha: captcha.data, captcha_id });
});
exports.captcha = captcha;
// post login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, captcha, captchaId } = req.body;
    try {
        const captchaRecord = captchaStore[captchaId];
        if (!captchaRecord || captchaRecord.expires < new Date()) {
            return res.status(400).json({ message: "Invalid or expired captcha" });
        }
        if (captcha !== captchaRecord.captcha) {
            return res.status(401).json({ message: "Invalid captcha" });
        }
        delete captchaStore[captchaId];
        const user = yield prisma.users.findFirst({
            where: { username },
            select: {
                id: true,
                username: true,
                password: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found!!" });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, 'kenkone_evas', { expiresIn: '1h' });
        logger_1.default.info(`login success username: ${username}`);
        res.status(200).json({ message: "login success", token });
    }
    catch (error) {
        logger_1.default.error(`login api error ${error}`);
        return res.status(500).json({ message: `login api error: ${error}` });
    }
});
exports.login = login;
// post logout
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        console.log(token);
        if (token) {
            tokenBlack.add(token);
            logger_1.default.info(`logout success`);
            res.status(200).json({ message: "Logged out success" });
        }
        else {
            logger_1.default.error("logout api error: no token provided");
            res.status(400).json({ message: "No token provided" });
        }
    }
    catch (error) {
        logger_1.default.error(`logout api error: ${error}`);
        return res.status(500).json({ message: `Logout api error ${error}` });
    }
});
exports.logout = logout;
// get user info
const userinfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        // get token
        const token = (_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Authentication token is required" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, 'kenkone_evas');
        const userId = decoded.id;
        // select sql
        const user = yield prisma.users.findFirst({
            where: { id: userId }
        });
        if (!user) {
            return res.status(responseStatus.not_found).json({ message: "get user info error: user not found" });
        }
        const user_role = yield prisma.roles.findFirst({
            where: { id: user === null || user === void 0 ? void 0 : user.role_id }
        });
        const user_permission = yield prisma.role_permissions.findMany({
            where: { role_id: user === null || user === void 0 ? void 0 : user.role_id },
            include: {
                permissions: true
            }
        });
        const permissionList = user_permission.map(per => per.permissions.permissions_name);
        const userinfo = {
            username: decoded.username,
            role: user_role === null || user_role === void 0 ? void 0 : user_role.role_name,
            permission: permissionList
        };
        logger_1.default.info(`fetch user info username: ${decoded.username}`);
        res.status(responseStatus.success).json({ user: userinfo });
    }
    catch (error) {
        logger_1.default.error(`user info api error`);
        return res.status(responseStatus.error).json({ message: `userinifo api error: ${error}` });
    }
});
exports.userinfo = userinfo;
// delete user
const softDeletedUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    try {
        const { Uid } = req.body;
        yield prisma.users.update({
            where: { id: Uid },
            data: { deleted: true }
        });
        logger_1.default.info(`deleted user id: ${Uid}`);
        res.status(responseStatus.success).json({ message: "User soft-deleted success" });
    }
    catch (error) {
        logger_1.default.error(`deleted user api error: ${error}`);
        res.status(responseStatus.error).json({ message: "Soft deleted error" });
    }
});
exports.softDeletedUser = softDeletedUser;
// edit password
exports.editPassword = [
    ...validpassword,
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { data } = req.body;
            console.log(req.body);
            const user = yield prisma.users.findFirst({
                where: { id: data.Uid }
            });
            if (!user) {
                logger_1.default.error("edit passwrod error: User not found");
                return res.status(responseStatus.not_found).json({ message: "get user info error: user not found" });
            }
            const hashedPassword = yield bcryptjs_1.default.hash(data.newPassword, 10);
            yield prisma.users.update({
                where: { id: data.Uid },
                data: {
                    password: hashedPassword,
                    updated_at: new Date()
                }
            });
            logger_1.default.info(`edit password api success username: ${user.username}`);
            res.status(responseStatus.success).json({ message: "edit password success" });
        }
        catch (error) {
            logger_1.default.error(`edit password api error: ${error}`);
            res.status(responseStatus.error).json({ message: "edit password api error" });
        }
    })
];
