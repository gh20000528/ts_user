"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionRoutes = void 0;
const express_1 = require("express");
const permissionsController_1 = require("../controllers/permissionsController");
class PermissionRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/permission', permissionsController_1.permissionList);
        this.router.post('/addRolePermission', permissionsController_1.addRolePermission);
        this.router.post('/deleteRolePermission', permissionsController_1.deleteRolePermission);
        this.router.get('/userRolePermission', permissionsController_1.UserRolePermission);
    }
}
exports.PermissionRoutes = PermissionRoutes;
