"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionRoutes = void 0;
const express_1 = require("express");
class PermissionRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/');
        this.router.post('/');
        this.router.post('/');
        this.router.get('/');
    }
}
exports.PermissionRoutes = PermissionRoutes;
