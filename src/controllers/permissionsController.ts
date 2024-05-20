import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import logger from '../tools/logger';

const prisma = new PrismaClient()

enum responseStatus {
    error = 400,
    not_found = 404,
    success = 200
}

// vaild permission
export const checkPermission = (reqPermission: string) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]
        if (!token) {
            return res.status(401).json({ message: "Authentication token is required" })
        }

        const decoded = jwt.verify(token, 'kenkone_evas') as { id: string, username: string}
        const userId = decoded.id

        const user = await prisma.users.findFirst({
            where: {id: userId},
            include: {
                role: {
                    include: {
                        role_permissions: {
                            include: {
                                permissions: true
                            }
                        }
                    }
                }
            }
        })
        
        const hasPermission = user?.role?.role_permissions.some(rp => rp.permissions.permissions_name === reqPermission)
        
        if (hasPermission) {
            next()
        } else {
            return res.status(401).json({ message: "Access denied. You do not have the required permission." })
        }
    } catch (error) {
        return res.status(500).json({ message: `permission vaild error: ${error}`})
    }   
}

// permission list
export const permissionList = async (req: Request, res: Response) => {
    try {
        const permissionName = await prisma.permissions.findMany()

        logger.info("fetch permission success")
        res.status(responseStatus.success).json({ data: permissionName })
    } catch (error) {
        logger.error(`permission api error: ${error}`)
        res.status(responseStatus.error).json({ message: "permission api err" })
    }
}


// add user permission api
export const addUserPermission = async (req: Request, res: Response) => {
    try {
        const { userId, permissionName } = req.body;

        const permission = await prisma.permissions.findFirst({ 
            where:{ permissions_name: permissionName }
        })
        if (!permission) {
            logger.error("add user permission api error permission not found")
            return res.status(responseStatus.not_found).json({ message: "permission not found" })
        }

        const user = await prisma.users.findFirst({
            where: { id: userId }
        })
        if (!user) {
            logger.error("add user permission api error user not found")
            return res.status(responseStatus.not_found).json({ message: "user not found" })
        }

        await prisma.user_permissions.create({
            data:{
                user_id: userId,
                permissions_id: permission.id
            }
        })

        logger.info(`add user permission success username: ${user.username}`)
        res.status(responseStatus.success).json({ message: "user add permission success" })
    } catch (error) {
        logger.error(`add user permission api error: ${error}`)
        res.status(responseStatus.error).json({ message: "add user permission api error" })
    }
}

// deleted user permission api
export const deletedUserPermission = async (req: Request, res: Response) => {
    try {
        const { userId, permissionName } = req.body

        const permission = await prisma.permissions.findFirst({ 
            where:{ permissions_name: permissionName }
        })
        if (!permission) {
            logger.error("deleted user permission api error permission not found")
            return res.status(responseStatus.not_found).json({ message: "permission not found" })
        }

        const user = await prisma.users.findFirst({
            where: { id: userId }
        })
        if (!user) {
            logger.error("deleted user permission api error user not found")
            return res.status(responseStatus.not_found).json({ message: "user not found" })
        }

        const userPermission = await prisma.user_permissions.findFirst({
            where:{
                user_id: userId,
                permissions_id: permission.id
            }
        })
        if (!userPermission) {
            logger.error("deleted user permission not found")
            return res.status(responseStatus.not_found).json({ message: "deleted user permission not found" })
        }

        await prisma.user_permissions.delete({
            where: { id: userPermission.id }
        })

        logger.info(`deleted ${user.username} permission: ${permissionName}`)
        res.status(responseStatus.success).json({ message: "deleted user permission success" })
    } catch (error) {
        logger.error(`deleted user permission api error: ${error}`)
        res.status(responseStatus.error).json({ message: "deleted user permission api error" })
    }
}