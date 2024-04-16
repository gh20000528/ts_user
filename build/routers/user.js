"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const express_validator_1 = require("express-validator");
class UserRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/', userController_1.userList);
        this.router.post('/', [
            (0, express_validator_1.body)('username').isString().notEmpty(),
            (0, express_validator_1.body)('password').isString().notEmpty(),
            (0, express_validator_1.body)('voice_attachment').isString().optional(),
            (0, express_validator_1.body)('role_id').isInt().notEmpty(),
        ], userController_1.register);
        this.router.post('/login', userController_1.login);
        this.router.get('/captcha', userController_1.captcha);
    }
}
exports.UserRoutes = UserRoutes;
