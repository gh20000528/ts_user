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
        this.router.post('/addUserPermission', permissionsController_1.addUserPermission);
        this.router.post('/deletedUserPermission', permissionsController_1.deletedUserPermission);
    }
}
exports.PermissionRoutes = PermissionRoutes;
