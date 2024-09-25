import { Request, Response } from "express";
import UserModel, { OtpModel } from "../models/auth";
import crypto from "crypto"
import sendSms from "../utils/send-sms";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { CustomRequest } from "../middlewares/verify-jwt";

export const handleSendOtp = async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.body
        if(!phoneNumber) {
            return res.status(400).json({ message: "Please provide a phone number" })
        }
        const userWithPhoneNumberExists = await UserModel.findOne({ phoneNumber: phoneNumber })
        if(userWithPhoneNumberExists) {
            return res.status(409).json({ message: "User with phone number already exists" })
        }
        await OtpModel.deleteOne({ phoneNumber });
        const otp = crypto.randomInt(100000, 999999).toString()
        const expiryDate = new Date(Date.now() + 5 * 60 * 1000)
        await OtpModel.create({
            phoneNumber: phoneNumber,
            otp: "000000",
            expiresAt: expiryDate,
        })
        const smsSent = await sendSms(phoneNumber, otp)
        if(!smsSent) {
            return res.status(500).json({ message: "Failed to send OTP, please retry" })
        } 
        res.status(200).json({ message: "Otp Sent Successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "An error occured" })
    }
}

export const handleVerifyOtp = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, otp } = req.body
        if(!phoneNumber) {
            return res.status(400).json({ message: "Please provide a phone number" })
        }
        if(!otp) {
            return res.status(400).json({ message: `Please provide the OTP sent to ${phoneNumber}` })
        }
        const existingOtp = await OtpModel.findOne({ phoneNumber: phoneNumber })
        if(!existingOtp) {
            return res.status(404).json({ message: "OTP not found" })
        }
        if(existingOtp.expiresAt < new Date()) {
            return res.status(400).json({ valid: false, message: "OTP expired" })
        }
        console.log(otp, "this is the entered otp")
        console.log(existingOtp.otp, "This is the existing otp")
        if(otp === existingOtp.otp) {
            await OtpModel.findByIdAndDelete(existingOtp._id)
            return res.status(200).json({ valid: true, message: "OTP verified successfully" })
        } else {
            return res.status(401).json({ valid: false, message: "Incorrect OTP" })
        }
    } catch (error) {
        console.error('Error in handleVerifyOtp:', error);
        return res.status(500).json({ valid: false, message: "An error occured" })
    }
}

export const handleLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body
        if(!email) {
            return res.status(400).json({ message: "Please provide an email address" })
        }
        if(!password) {
            return res.status(400).json({ message: "Please provide a password" })
        }
        const userExists = await UserModel.findOne({ email: email })
        if(!userExists) {
            return res.status(404).json({ message: "User with this email found" })
        }
        const passwordMatch = await bcrypt.compare(password, userExists.password!)
        if(!passwordMatch) {
            return res.status(401).json({ message: "Incorrect password" })
        }
        const token = jwt.sign({ userId: userExists._id }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '3d' })

        const data = {
            token: token,
            user: {
                email: userExists.email,
                phoneNumber: userExists.phoneNumber,
            }
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json( { message: "An error occured" })
    }
}

export const handleSignup = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, email, password } = req.body
        if(!phoneNumber || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" })
        }
        const userExists = await UserModel.findOne({ phoneNumber: phoneNumber })
        if(userExists) {
            return res.status(404).json({ message: "User with this phone number already exists"})
        }
        const userWithNewEmailExists = await UserModel.findOne({ email: email })
        if(userWithNewEmailExists) {
            return res.status(409).json({ message: "Email is already in use by another user" })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await UserModel.create({ phoneNumber: phoneNumber, email: email, password: hashedPassword })
        const token = jwt.sign({ id: newUser._id }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "3d" })

        const data = {
            token: token,
            user: {
                email: newUser?.email,
                phoneNumber: newUser?.phoneNumber,
            }
        }
        return res.status(200).json({ data: data, message: "User registered successfully" })
    } catch(error) {
        console.log(error)
        return res.status(500).json({ message: "An error occured" })
    }
}

// birthdate, gender, username, relationshipGoal, distancePreference, interests[], pictures[],



export const handleResetPasswword = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, newPassword } = req.body
        if(!phoneNumber) {
            return res.status(400).json({ message: "Phone number is required" })
        }
        if(!newPassword) {
            return res.status(400).json({ message: "The new password is required" })
        }
        const userExists = await UserModel.findOne({ phoneNumber: phoneNumber })
        if(!userExists) {
            return res.status(404).json({ message: "User with this phone number does not exist."})
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await UserModel.findByIdAndUpdate(userExists._id, { password: hashedPassword })
        return res.status(200).json({ message: "Password reset successfully" })
    } catch(error) {
        console.log(error)
        return res.status(500).json({ message: "An error occured" })
    }
}