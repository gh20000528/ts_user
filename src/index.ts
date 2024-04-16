import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cookieSession from 'cookie-session';
import { UserRoutes } from './routers/user';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();

// DO NOT WRITE

class Server {
    app: express.Express = express();

    constructor() {
        this.app.use(bodyParser.urlencoded({ extended: true }))
        this.app.use(cookieSession({ keys: ['laskdjf'] }))
        this.app.use(cookieParser())
        this.app.use(cors({
            origin: 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST']
        }))
        this.app.use(session({
            secret: 'keyboard cat',
            resave: true,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                maxAge: 30000
            }
        }))
        this.setUpRoutes();
    }

    private setUpRoutes(): void {
        const userRoutes = new UserRoutes();
        this.app.use('/api/user', userRoutes.router)
    }

    start(): void {
        this.app.listen(3001, () => {
            console.log('Listening on port 3000');
        })
    }
} 

new Server().start();
