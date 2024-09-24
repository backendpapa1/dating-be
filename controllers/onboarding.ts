import { Request, Response } from 'express'
import UserModel from '../models/auth'
import { CustomRequest } from '../middlewares/verify-jwt'
import mongoose from 'mongoose'

interface UpdateData {
    [key: string]: string | string[]
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

class OnboardStep {
    field: keyof UpdateData;
    fieldName: string;

    constructor (field: keyof UpdateData, fieldName: string) {
        this.field = field
        this.fieldName = fieldName
    }

    validate(updateData: UpdateData): boolean {
        const fieldValue = updateData[this.field]
        if (typeof fieldValue === 'string') {
            return true
        } else if (Array.isArray(fieldValue)) {
            return fieldValue.every(item => typeof item === 'string' && item.trim())
        } else {
            return false
        }
    }

    updateUser = async (
        res: Response,
        updateData: UpdateData,
        userId: mongoose.Types.ObjectId
    ) => {
        if (!updateData[this.field]) {
            return res.status(400).json({
                message: `${this.fieldName} is required`,
                success: false
            })
        }
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { [this.field]: updateData[this.field] },
            { new: true }
        )
        return res.status(200).json(
            {
                message: `${this.fieldName} updated successfully`,
                data: {
                    payload: updatedUser
                },
                success: true
            }
        )
    }
}

const stepFieldMap: Record<OnboardingStep, OnboardStep> = {
    [OnboardingStep.Username]: new OnboardStep("username", "Username"),
    [OnboardingStep.BirthDate]: new OnboardStep("birthDate", "Birth Date"),
    [OnboardingStep.Gender]: new OnboardStep("gender", "Gender"),
    [OnboardingStep.RelationshipGoal]: new OnboardStep("relationshipGoal", "Relationship Goal"),
    [OnboardingStep.DistancePreference]: new OnboardStep("distancePreference", "Distance Preference"),
    [OnboardingStep.Interests]: new OnboardStep("interests", "Interests"),
    [OnboardingStep.Pictures]: new OnboardStep("pictures", "Pictures"),
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
        if (!Object.values(OnboardingStep).includes(step as OnboardingStep)) {
            return res.status(400).json({
                message: "Invalid Step",
                success: false,
            });
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
        if (!stepInfo.validate(updateData)) {
            return res.status(400).json(
                {
                    message: "Invalid Data",
                    success: false
                }
            )
        }
        await stepInfo.updateUser(res, updateData, userId)

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