import { Request, Response } from 'express'
import UserModel from '../models/auth'
import { CustomRequest } from '../middlewares/verify-jwt'
import mongoose from 'mongoose'

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

interface UpdateData {
    [key: string]: string | string[]
}

const updateUser = async (
    res: Response,
    field: string,
    fieldName: string,
    updateData: UpdateData,
    userId: mongoose.Types.ObjectId
) => {
        if (!updateData[field]) {
            return res.status(400).json({
                message: `${fieldName} is required`,
                success: false
            })
        }
        if (
                typeof updateData[field] === 'string' ||
                (
                    Array.isArray(updateData[field]) &&
                    updateData[field].every(
                        (item) => typeof item ==='string' && item.trim()
                    )
                )
            ) {
                const updatedUser = await UserModel.findByIdAndUpdate(
                    userId,
                    { [field]: updateData[field] },
                    { new: true }
                )
                return res.status(200).json(
                    {
                        message: `${fieldName} updated successfully`,
                        data: {
                            payload: updatedUser
                        },
                        success: true
                    }
                )
        } else {
            return res.status(400).json({
                message: `Invalid ${fieldName} type`
            })
        }
}

enum OnboardingStep {
    Username = 1,
    BirthDate,
    Gender,
    RelationshipGoal,
    DistancePreference,
    Interests,
    Pictures
}

const stepFieldMap: Record<OnboardingStep, {field: keyof UpdateData, fieldName: string}> = {
    [OnboardingStep.Username]: { field: "username", fieldName: "Username" },
    [OnboardingStep.BirthDate]: { field: "birthDate", fieldName: "Birth Date" },
    [OnboardingStep.Gender]: { field: "gender", fieldName: "Gender" },
    [OnboardingStep.RelationshipGoal]: { field: "relationshipGoal", fieldName: "Relationship Goal" },
    [OnboardingStep.DistancePreference]: { field: "distancePreference", fieldName: "Distance Preference" },
    [OnboardingStep.Interests]: { field: "interests", fieldName: "Interests" },
    [OnboardingStep.Pictures]: { field: "pictures", fieldName: "Pictures" },
};

export const handleMultiStepOnboarding = async (req: Request, res: Response) => {
    try {
        const { step, updateData } = req.body

        const userId = (req as CustomRequest)?.token?.id
        const userExists = await UserModel.findById(userId)
        if (!userExists) {
            return res.status(404).json(
                {
                    message: "This user does not exist",
                    success: false
                }
            )
        }
        if (!step || !updateData) {
            return res.status(400).json(
                {
                    message: "Bad data, Failed to save information",
                    success: false
                }
            )
        }
        const stepInfo = stepFieldMap[step as OnboardingStep]
        if (!stepInfo) {
            return res.status(400).json(
                {
                    message: "Invalid Step",
                    success: false
                }
            )
        }
        await updateUser(res, stepInfo.field as string, stepInfo.fieldName, updateData, userId)

    } catch (error) {
        console.log(error)
        return res.status(500).json(
            {
                message: "An Error Occured",
                success: false
            }
        )
    }
}