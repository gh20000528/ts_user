"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRoutes = void 0;
const express_1 = require("express");
const roleController_1 = require("../controllers/roleController");
class RoleRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/', roleController_1.role);
    }
}
exports.RoleRoutes = RoleRoutes;
