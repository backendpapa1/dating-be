import { Request, Response } from 'express'
import UserModel from '../models/auth'
import { CustomRequest } from '../middlewares/verify-jwt'

export const handleOnboarding = async (req: Request, res: Response) => {
    try {
        const userId = (req as CustomRequest)?.token?.id
        if(!userId) {
            return res.status(401).json({ message: "Please login again" })
        }
        const { birthDate, gender, username, relationshipGoal, distancePreference, interests, pictures } = req.body
        // if(!birthDate || !gender || !username || !relationshipGoal || !distancePreference || !interests || !pictures) {
        //     return res.status(400).json({ message: "All credentials are required" })
        // }
        const userExists = await UserModel.findById(userId)
        if(!userExists) {
            return res.status(404).json({ message: "User does not exist" })
        }
        const updatedUser = await UserModel.findByIdAndUpdate(userId, { birthDate, gender, username, relationshipGoal, distancePreference, interests, pictures, onboarded: true })
        return res.status(200).json({ message: "User onboarded successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "An error occured" })
    }
}