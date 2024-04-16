import { Router } from 'express';
import { userList, register, captcha, login } from '../controllers/userController';
import { body } from 'express-validator';

export class UserRoutes {
    router: Router;
    constructor() {
        this.router = Router();
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get('/', userList)
        this.router.post('/',[
            body('username').isString().notEmpty(),
            body('password').isString().notEmpty(),
            body('voice_attachment').isString().optional(),
            body('role_id').isInt().notEmpty(),
        ], register)
        this.router.post('/login', login)
        this.router.get('/captcha', captcha)
    }
}