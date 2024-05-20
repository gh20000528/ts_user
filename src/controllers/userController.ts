import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';
import logger from '../tools/logger';
const prisma = new PrismaClient()

// all type
enum responseStatus {
    error = 400,
    not_found = 404,
    success = 200
}
interface CaptchaStore {
    [key: string]: {
        captcha: string;
        expires: Date;
    };
}

interface loginReq {
    username: string,
    password: string,
    captcha: string,
    captchaId: string
}

interface IUserDetails {
    username: string,
    role: string | undefined,
    permission: string[]
}

// tool function
const captchaStore: CaptchaStore = {};

const tokenBlack = new Set();

// 清除req雜值
function cleanString(input: any) {
    return input.replace(/\0/g, '');
}

// valid password
const validpassword = [
    check('password')
        .isLength({ min: 8 }).withMessage("密碼要超過八碼")
        .matches(/[a-zA-z]/).withMessage("密碼中要包含至少一個英文字")
        .matches(/\d/).withMessage("密碼中要包含至少一個數字")
]


// api function
// get user list
export const userList = async (req: Request, res: Response) => {
    try {
        const userList = await prisma.users.findMany({
            select: {
                id: true,
                username: true, 
                voice_attachment: true,
                password: false, 
                role_id: true,
                deleted: true,
                role: {
                    select: {
                        role_name: true
                    }
                }
            }
        });

        const formattedUser = userList.map(user => ({
            id: user.id,
            username: user.username,
            voice_attachment: user.voice_attachment,
            role: user.role_id,
            delete: user.deleted,
            roleName: user.role.role_name
        }))


        logger.info('fetch user list success')
        res.status(responseStatus.success).json({ data: formattedUser })
    } catch (error) {
        logger.error(`user list api error: ${error}`)
        res.status(responseStatus.error).json({ message: `get user list error ${error}` })
    }
    
}



// post register
export const register = [
    ...validpassword,
    async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
            
        const { username, password, voice_attachment, role_id} = req.body

        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "valid error" });
        }
        
        const parsedRoleId = parseInt(role_id, 10)
        if (isNaN(parsedRoleId)) {
            return res.status(400).json({ message: "Invalid role_id, it must be a number." })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const cleanUsername = cleanString(username);
        const cleanPassword = cleanString(password);

        console.log(cleanUsername, cleanPassword);
        

        await prisma.users.create({
            data: {
                username,
                password: hashedPassword,
                voice_attachment,
                role_id: parsedRoleId
            }
        })

        logger.info(`create user success username: ${username}`)
        res.status(200).json({ message: "create user success" })
    } catch (error) {
        logger.error(`register api error: ${error}`)
        return res.status(500).json({ message: `Register api error: ${error}` })
    }
}
]

// get captcha
export const captcha = async (req: Request, res: Response) => {
    const captchaOptions = {
        size: 4, // 验证码长度
        noise: 5, // 噪点数量
        color: true, // 验证码字符是否有颜色
        background: '#cc9999', // 背景颜色
        fontSize: 70, // 文字大小
        ignoreChars: '0o1it', // 排除易混淆的字符
        width: 200,
        height: 80,
        complexity: 10, // 复杂度，越高越难
    };
    const captcha = svgCaptcha.create(captchaOptions);
    const captcha_id = uuidv4();

    captchaStore[captcha_id] = {
        captcha: captcha.text,
        expires: new Date(Date.now() + 60000)
    };
    
    logger.info("get captcha success")
    res.status(200).json({ captcha: captcha.data, captcha_id })
}
// post login
export const login = async (req: Request, res: Response) => {
    const  {username, password, captcha, captchaId} = req.body as loginReq
    
    try {
        const captchaRecord = captchaStore[captchaId];
        if (!captchaRecord || captchaRecord.expires < new Date()) {
            return res.status(400).json({ message: "Invalid or expired captcha" })
        }

        if (captcha !== captchaRecord.captcha) {
            return res.status(401).json({ message: "Invalid captcha" })
        }

        delete captchaStore[captchaId]

        const user = await prisma.users.findFirst({
            where:{ username },
            select: {
                id: true,
                username: true,
                password: true
            }
        })

        if (!user) {
            return res.status(404).json({ message: "User not found!!" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" })
        }

        const token = jwt.sign({id: user.id, username: user.username }, 'kenkone_evas' , {expiresIn: '1h'})
        
        logger.info(`login success username: ${username}`)
        res.status(200).json({ message: "login success", token})
    } catch (error) {
        logger.error(`login api error ${error}`)
        return res.status(500).json({ message: `login api error: ${error}` })
    }
}


// post logout
export const logout = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        console.log(token);
        
        if (token) {
            tokenBlack.add(token)
            logger.info(`logout success`)
            res.status(200).json({ message: "Logged out success" })
        } else {
            logger.error("logout api error: no token provided")
            res.status(400).json({ message: "No token provided" })
        }
    } catch (error) {
        logger.error(`logout api error: ${error}`)
        return res.status(500).json({ message: `Logout api error ${error}` })
    }
}

// get user info
export const userinfo = async (req: Request, res: Response) => {
    try {
        // get token
        const token = req.headers.authorization?.split(" ")[1]
        if (!token) {
            return res.status(401).json({ message: "Authentication token is required" })
        }

        const decoded = jwt.verify(token, 'kenkone_evas') as { id: string, username: string}
        const userId = decoded.id


        // select sql
        const user = await prisma.users.findFirst({
            where: { id: userId }
        })        
        if (!user) {
            return res.status(responseStatus.not_found).json({ message: "get user info error: user not found" })
        }

        const user_role = await prisma.roles.findFirst({ 
            where: {id: user?.role_id}
        })
        const user_permission = await prisma.role_permissions.findMany({
            where: {role_id: user?.role_id},
            include: {
                permissions: true
            }
        })
        const permissionList = user_permission.map(per => per.permissions.permissions_name)
        
        const userinfo: IUserDetails = {
            username: decoded.username,
            role: user_role?.role_name,
            permission: permissionList
        }
        
        logger.info(`fetch user info username: ${decoded.username}`)
        res.status(responseStatus.success).json({ user: userinfo })
    } catch (error) {
        logger.error(`user info api error`)
        return res.status(responseStatus.error).json({ message: `userinifo api error: ${error}` })
    }
}


// delete user
export const softDeletedUser= async (req: Request, res: Response) => {
    console.log(req.body);
    
    try {
        const { Uid } = req.body

        await prisma.users.update({
            where: { id: Uid },
            data: { deleted: true }
        })

        logger.info(`deleted user id: ${Uid}`)
        res.status(responseStatus.success).json({ message: "User soft-deleted success" })
    } catch (error) {
        logger.error(`deleted user api error: ${error}`)
        res.status(responseStatus.error).json({ message: "Soft deleted error" })
    }
}

// edit password
export const editPassword = [
    ...validpassword,
    async (req: Request, res: Response) => {
        try {
            const { data } = req.body

            console.log(req.body);
            

            const user = await prisma.users.findFirst({ 
                where: { id: data.Uid }
            })
    
            
            if (!user) {
                logger.error("edit passwrod error: User not found")
                return res.status(responseStatus.not_found).json({ message: "get user info error: user not found" })
            }

            const hashedPassword = await bcrypt.hash(data.newPassword, 10)
            await prisma.users.update({
                where: { id: data.Uid },
                data: { 
                    password: hashedPassword,
                    updated_at: new Date()
                }
            })

            logger.info(`edit password api success username: ${user.username}`)
            res.status(responseStatus.success).json({ message: "edit password success"})
        } catch (error) {
            logger.error(`edit password api error: ${error}`)
            res.status(responseStatus.error).json({ message: "edit password api error" })
        }
    }
]

