import { Router } from 'express';
import { permissionList, addUserPermission, deletedUserPermission } from '../controllers/permissionsController';

export class PermissionRoutes {
    router: Router;
    constructor() {
        this.router = Router();
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get('/permission', permissionList)
        this.router.post('/addUserPermission', addUserPermission)
        this.router.post('/deletedUserPermission', deletedUserPermission)
    }
}