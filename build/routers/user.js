"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const express_validator_1 = require("express-validator");
const permissionsController_1 = require("../controllers/permissionsController");
class UserRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/', userController_1.userList);
        this.router.post('/register', [
            (0, express_validator_1.body)('username').isString().notEmpty(),
            (0, express_validator_1.body)('password').isString().notEmpty(),
            (0, express_validator_1.body)('voice_attachment').notEmpty(),
            (0, express_validator_1.body)('role_id').notEmpty(),
        ], (0, permissionsController_1.checkPermission)('newUser'), userController_1.register);
        this.router.post('/login', userController_1.login);
        this.router.post('/logout', userController_1.logout);
        this.router.get('/captcha', userController_1.captcha);
        this.router.get('/userinfo', userController_1.userinfo);
        this.router.post('/softDeleted', (0, permissionsController_1.checkPermission)('deletedUser'), userController_1.softDeletedUser),
            this.router.post('/editPassword', (0, permissionsController_1.checkPermission)('editPassword'), userController_1.editPassword);
    }
}
exports.UserRoutes = UserRoutes;
