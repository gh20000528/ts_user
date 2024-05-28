import { Router } from 'express';
import { permissionList, addRolePermission, deleteRolePermission, UserRolePermission } from '../controllers/permissionsController';

export class PermissionRoutes {
    router: Router;
    constructor() {
        this.router = Router();
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get('/permission', permissionList)
        this.router.post('/addRolePermission', addRolePermission)
        this.router.post('/deleteRolePermission', deleteRolePermission)
        this.router.get('/userRolePermission', UserRolePermission)
    }
}