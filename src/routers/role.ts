import { Router } from 'express';
import { role } from '../controllers/roleController';

export class RoleRoutes {
    router: Router;
    
    constructor() {
        this.router = Router();
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get('/', role)
    }
}



