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
exports.deleteRolePermission = exports.addRolePermission = exports.UserRolePermission = exports.permissionList = exports.checkPermission = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../tools/logger"));
const prisma = new client_1.PrismaClient();
var responseStatus;
(function (responseStatus) {
    responseStatus[responseStatus["error"] = 400] = "error";
    responseStatus[responseStatus["not_found"] = 404] = "not_found";
    responseStatus[responseStatus["success"] = 200] = "success";
    responseStatus[responseStatus["conflict"] = 401] = "conflict";
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
// role map 
const UserRolePermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allRoles = yield prisma.roles.findMany({
            include: {
                role_permissions: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });
        const data = allRoles.map(role => {
            // 获取角色的所有权限
            const rolePermissions = role.role_permissions.map(rp => ({
                id: rp.permissions.id,
                name: rp.permissions.permissions_name,
            }));
            // 去除重复权限
            const uniquePermissions = Array.from(new Map(rolePermissions.map(p => [p.id, p])).values());
            return {
                id: role.id,
                role_name: role.role_name,
                permissions: uniquePermissions,
            };
        });
        res.status(responseStatus.success).json({ data });
    }
    catch (error) {
        res.status(responseStatus.error).json({ message: "mapRolePermission api error" });
    }
});
exports.UserRolePermission = UserRolePermission;
// add role permission api
const addRolePermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId, permissionName } = req.body;
        console.log(roleId, permissionName);
        const permission = yield prisma.permissions.findFirst({
            where: { permissions_name: permissionName }
        });
        // valid permission
        if (!permission) {
            logger_1.default.error("add role permission api error permission not found");
            return res.status(responseStatus.not_found).json({ message: "permission not found" });
        }
        const role = yield prisma.roles.findFirst({
            where: { id: roleId }
        });
        // valid role
        if (!role) {
            logger_1.default.error("add role permission api error role not found");
            return res.status(responseStatus.not_found).json({ message: "role not found" });
        }
        const rolePermission = yield prisma.role_permissions.findFirst({
            where: {
                role_id: roleId,
                permissions_id: permission.id
            }
        });
        if (rolePermission) {
            logger_1.default.error("permission is already init");
            return res.status(responseStatus.conflict).json({ message: "role already has this permission" });
        }
        yield prisma.role_permissions.create({
            data: {
                role_id: roleId,
                permissions_id: permission.id
            }
        });
        logger_1.default.info(`add role permission success role name: ${role.role_name}`);
        res.status(responseStatus.success).json({ message: "role add permission success" });
    }
    catch (error) {
        logger_1.default.error(`add role permission api error: ${error}`);
        res.status(responseStatus.error).json({ message: "add role permission api error" });
    }
});
exports.addRolePermission = addRolePermission;
// delete role permission api
const deleteRolePermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId, permissionName } = req.body;
        const permission = yield prisma.permissions.findFirst({
            where: { permissions_name: permissionName }
        });
        if (!permission) {
            logger_1.default.error("delete role permission api error permission not found");
            return res.status(responseStatus.not_found).json({ message: "permission not found" });
        }
        const role = yield prisma.roles.findFirst({
            where: { id: roleId }
        });
        if (!role) {
            logger_1.default.error("delete role permission api error role not found");
            return res.status(responseStatus.not_found).json({ message: "role not found" });
        }
        const rolePermission = yield prisma.role_permissions.findFirst({
            where: {
                role_id: roleId,
                permissions_id: permission.id
            }
        });
        if (!rolePermission) {
            logger_1.default.error("delete role permission not found");
            return res.status(responseStatus.not_found).json({ message: "role permission not found" });
        }
        yield prisma.role_permissions.delete({
            where: { id: rolePermission.id }
        });
        logger_1.default.info(`deleted permission ${permissionName} from role: ${role.role_name}`);
        res.status(responseStatus.success).json({ message: "deleted role permission success" });
    }
    catch (error) {
        logger_1.default.error(`delete role permission api error: ${error}`);
        res.status(responseStatus.error).json({ message: "delete role permission api error" });
    }
});
exports.deleteRolePermission = deleteRolePermission;
