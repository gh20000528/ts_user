import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../tools/logger';

const prisma = new PrismaClient()


// get user role
export const role = async (req: Request, res: Response) => {
    try {
        const role = await prisma.roles.findMany()

        logger.info("fetch role name success")
        res.status(200).json({ role })
    } catch (error) {
        res.status(500).json({ error })
    }
}