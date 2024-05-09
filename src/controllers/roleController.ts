import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()


// get user role
export const role = async (req: Request, res: Response) => {
    try {
        const role = await prisma.roles.findMany()

        res.status(200).json({ role })
    } catch (error) {
        res.status(500).json({ error })
    }
}