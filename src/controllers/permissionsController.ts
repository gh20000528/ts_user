import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient()

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
            return res.status(403).json({ message: "Access denied. You do not have the required permission." })
        }
    } catch (error) {
        return res.status(500).json({ message: `permission vaild error: ${error}`})
    }   
}