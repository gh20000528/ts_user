import { Router } from 'express';
import { userList, register, captcha, login, logout } from '../controllers/userController';
import { body } from 'express-validator';
import { checkPermission } from '../controllers/permissionsController';

export class UserRoutes {
    router: Router;
    constructor() {
        this.router = Router();
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get('/', userList)
        this.router.post('/register',[
            body('username').isString().notEmpty(),
            body('password').isString().notEmpty(),
            body('voice_attachment').notEmpty(),
            body('role_id').notEmpty(),
        ], checkPermission('newUser'), register)
        this.router.post('/login', login)
        this.router.post('/logout', logout)
        this.router.get('/captcha', captcha)
    }
}