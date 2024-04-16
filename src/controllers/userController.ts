import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import svgCaptcha from 'svg-captcha';
import Cookies from 'cookies';
import cookieParser from 'cookie-parser';


const prisma = new PrismaClient()



interface loginReq {
    username: string,
    password: string,
    captcha: string
}


export const userList = async (req: Request, res: Response) => {
    const userList = await prisma.users.findMany();

    res.status(200).json({ data: userList })
}

export const register = async (req: Request, res: Response) => {
    const { username, password, voice_attachment, role_id} = req.body
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.users.create({
            data: {
                username,
                password: hashedPassword,
                voice_attachment,
                role_id
            }
        })

        res.status(200).json({ message: "create user success" })
    } catch (error) {
        return res.status(500).json({ message: `Register api error: ${error}` })
    }
}

// get captcha
export const captcha = async (req: Request, res: Response) => {
    const captchaOptions = {
        size: 4, // 验证码长度
        noise: 15, // 噪点数量
        color: true, // 验证码字符是否有颜色
        background: '#cc9966', // 背景颜色
        fontSize: 50, // 文字大小
        ignoreChars: '0o1i', // 排除易混淆的字符
        complexity: 10, // 复杂度，越高越难
    };
    const captcha = svgCaptcha.create(captchaOptions);

    res.cookie("captcha", captcha.text, {httpOnly: true, secure: false})
    
    // 發送驗證碼
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(captcha.data);
}

export const login = async (req: Request, res: Response) => {
    const  {username, password, captcha} = req.body as loginReq
    
    try {
        const saveCaptcha = req.cookies["captcha"];
        console.log(saveCaptcha); 

        const user = await prisma.users.findFirst({
            where:{ username }
        })

        if (!user) {
            return res.status(404).json({ message: "User not found!!" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" })
        }

        const token = jwt.sign({id: user.id, username: user.username }, 'your_secret_key' , {expiresIn: '1h'})
        req.session.token = token;

        res.status(200).json({ message: "login success", token})
    } catch (error) {
        return res.status(500).json({ message: `login api error: ${error}` })
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        
    } catch (error) {
        return res.status(500).json({ message: `Logout api error ${error}` })
    }
}