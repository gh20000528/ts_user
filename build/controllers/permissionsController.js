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
exports.deletedUserPermission = exports.addUserPermission = exports.permissionList = exports.checkPermission = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../tools/logger"));
const prisma = new client_1.PrismaClient();
var responseStatus;
(function (responseStatus) {
    responseStatus[responseStatus["error"] = 400] = "error";
    responseStatus[responseStatus["not_found"] = 404] = "not_found";
    responseStatus[responseStatus["success"] = 200] = "success";
})(responseStatus || (responseStatus = {}));
// vaild permission
const checkPermission = (reqPermission) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Authentication token is required" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, 'kenkone_evas');
        const userId = decoded.id;
        const user = yield prisma.users.findFirst({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        role_permissions: {
                            include: {
                                permissions: true
                            }
                        }
                    }
                }
            }
        });
        const hasPermission = (_b = user === null || user === void 0 ? void 0 : user.role) === null || _b === void 0 ? void 0 : _b.role_permissions.some(rp => rp.permissions.permissions_name === reqPermission);
        if (hasPermission) {
            next();
        }
        else {
            return res.status(401).json({ message: "Access denied. You do not have the required permission." });
        }
    }
    catch (error) {
        return res.status(500).json({ message: `permission vaild error: ${error}` });
    }
});
exports.checkPermission = checkPermission;
// permission list
const permissionList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const permissionName = yield prisma.permissions.findMany();
        logger_1.default.info("fetch permission success");
        res.status(responseStatus.success).json({ data: permissionName });
    }
    catch (error) {
        logger_1.default.error(`permission api error: ${error}`);
        res.status(responseStatus.error).json({ message: "permission api err" });
    }
});
exports.permissionList = permissionList;
// add user permission api
const addUserPermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, permissionName } = req.body;
        const permission = yield prisma.permissions.findFirst({
            where: { permissions_name: permissionName }
        });
        if (!permission) {
            logger_1.default.error("add user permission api error permission not found");
            return res.status(responseStatus.not_found).json({ message: "permission not found" });
        }
        const user = yield prisma.users.findFirst({
            where: { id: userId }
        });
        if (!user) {
            logger_1.default.error("add user permission api error user not found");
            return res.status(responseStatus.not_found).json({ message: "user not found" });
        }
        yield prisma.user_permissions.create({
            data: {
                user_id: userId,
                permissions_id: permission.id
            }
        });
        logger_1.default.info(`add user permission success username: ${user.username}`);
        res.status(responseStatus.success).json({ message: "user add permission success" });
    }
    catch (error) {
        logger_1.default.error(`add user permission api error: ${error}`);
        res.status(responseStatus.error).json({ message: "add user permission api error" });
    }
});
exports.addUserPermission = addUserPermission;
// deleted user permission api
const deletedUserPermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, permissionName } = req.body;
        const permission = yield prisma.permissions.findFirst({
            where: { permissions_name: permissionName }
        });
        if (!permission) {
            logger_1.default.error("deleted user permission api error permission not found");
            return res.status(responseStatus.not_found).json({ message: "permission not found" });
        }
        const user = yield prisma.users.findFirst({
            where: { id: userId }
        });
        if (!user) {
            logger_1.default.error("deleted user permission api error user not found");
            return res.status(responseStatus.not_found).json({ message: "user not found" });
        }
        const userPermission = yield prisma.user_permissions.findFirst({
            where: {
                user_id: userId,
                permissions_id: permission.id
            }
        });
        if (!userPermission) {
            logger_1.default.error("deleted user permission not found");
            return res.status(responseStatus.not_found).json({ message: "deleted user permission not found" });
        }
        yield prisma.user_permissions.delete({
            where: { id: userPermission.id }
        });
        logger_1.default.info(`deleted ${user.username} permission: ${permissionName}`);
        res.status(responseStatus.success).json({ message: "deleted user permission success" });
    }
    catch (error) {
        logger_1.default.error(`deleted user permission api error: ${error}`);
        res.status(responseStatus.error).json({ message: "deleted user permission api error" });
    }
});
exports.deletedUserPermission = deletedUserPermission;
