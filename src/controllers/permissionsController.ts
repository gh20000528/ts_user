import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import logger from '../tools/logger';

const prisma = new PrismaClient()

enum responseStatus {
    error = 400,
    not_found = 404,
    success = 200,
    conflict = 401
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

// role map 
export const UserRolePermission = async (req: Request, res: Response) => {
    try {
        const allRoles = await prisma.roles.findMany({
            include: {
                role_permissions: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });

        const data = allRoles.map(role => {
            // 获取角色的所有权限
            const rolePermissions = role.role_permissions.map(rp => ({
                id: rp.permissions.id,
                name: rp.permissions.permissions_name,
            }));

            // 去除重复权限
            const uniquePermissions = Array.from(new Map(rolePermissions.map(p => [p.id, p])).values());

            return {
                id: role.id,
                role_name: role.role_name,
                permissions: uniquePermissions,
            };
        });



        res.status(responseStatus.success).json({ data })
    } catch (error) {
        res.status(responseStatus.error).json({ message: "mapRolePermission api error" })
    }
}


// add role permission api
export const addRolePermission = async (req: Request, res: Response) => {
    try {
        const { roleId, permissionName } = req.body;

        console.log(roleId, permissionName);
        

        const permission = await prisma.permissions.findFirst({
            where: { permissions_name: permissionName }
        });
        // valid permission
        if (!permission) {
            logger.error("add role permission api error permission not found");
            return res.status(responseStatus.not_found).json({ message: "permission not found" });
        }

        const role = await prisma.roles.findFirst({
            where: { id: roleId }
        });
        // valid role
        if (!role) {
            logger.error("add role permission api error role not found");
            return res.status(responseStatus.not_found).json({ message: "role not found" });
        }

        const rolePermission = await prisma.role_permissions.findFirst({
            where: {
                role_id: roleId,
                permissions_id: permission.id
            }
        });

        
        if (rolePermission) {
            logger.error("permission is already init");
            return res.status(responseStatus.conflict).json({ message: "role already has this permission" });
        }

        await prisma.role_permissions.create({
            data: {
                role_id: roleId,
                permissions_id: permission.id
            }
        });

        logger.info(`add role permission success role name: ${role.role_name}`);
        res.status(responseStatus.success).json({ message: "role add permission success" });
    } catch (error) {
        logger.error(`add role permission api error: ${error}`);
        res.status(responseStatus.error).json({ message: "add role permission api error" });
    }
}

// delete role permission api
export const deleteRolePermission = async (req: Request, res: Response) => {
    try {
        const { roleId, permissionName } = req.body;

        const permission = await prisma.permissions.findFirst({
            where: { permissions_name: permissionName }
        });
        if (!permission) {
            logger.error("delete role permission api error permission not found");
            return res.status(responseStatus.not_found).json({ message: "permission not found" });
        }

        const role = await prisma.roles.findFirst({
            where: { id: roleId }
        });
        if (!role) {
            logger.error("delete role permission api error role not found");
            return res.status(responseStatus.not_found).json({ message: "role not found" });
        }

        const rolePermission = await prisma.role_permissions.findFirst({
            where: {
                role_id: roleId,
                permissions_id: permission.id
            }
        });

        if (!rolePermission) {
            logger.error("delete role permission not found");
            return res.status(responseStatus.not_found).json({ message: "role permission not found" });
        }

        await prisma.role_permissions.delete({
            where: { id: rolePermission.id }
        });

        logger.info(`deleted permission ${permissionName} from role: ${role.role_name}`);
        res.status(responseStatus.success).json({ message: "deleted role permission success" });
    } catch (error) {
        logger.error(`delete role permission api error: ${error}`);
        res.status(responseStatus.error).json({ message: "delete role permission api error" });
    }
}
