import { NextFunction, Request, Response } from "express";
import 'dotenv/config'
import jwt, { JwtPayload } from 'jsonwebtoken'

export interface CustomRequest extends Request {
    token: JwtPayload
}

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1]
        if(!token) {
        return res.status(401).json({"message": "User is not authenticated"})
        }
        const secret = process.env.ACCESS_TOKEN_SECRET!;
        const decoded = jwt.verify(token, secret);
        (req as CustomRequest).token = (decoded as JwtPayload)
        next()
    } catch (error) {
        console.log(error)
        res.status(401).json({"message": "User is unauthenticated"})
    }
}