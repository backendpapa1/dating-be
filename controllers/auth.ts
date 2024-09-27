import { Request, Response } from "express";
import UserModel, { OtpModel } from "../models/auth";
import crypto from "crypto";
import sendSms from "../utils/send-sms";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

interface AuthData {
    token: string;
    user: {
        email: string;
        phoneNumber: string;
    };
}

class AuthController {
    private static generateToken(userId: string): string {
        return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET!);
    }

    private static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    static async handleSendOtp(req: Request, res: Response): Promise<Response> {
        try {
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({ message: "Please provide a phone number", success: false });
            }

            const userExists = await UserModel.findOne({ phoneNumber });
            if (userExists) {
                return res.status(409).json({ message: "User with phone number already exists", success: false });
            }

            await OtpModel.deleteOne({ phoneNumber });
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiryDate = new Date(Date.now() + 5 * 60 * 1000);

            await OtpModel.create({
                phoneNumber,
                otp: "000000", // Consider using the actual OTP in production
                expiresAt: expiryDate,
            });

            const smsSent = await sendSms(phoneNumber, otp);
            if (!smsSent) {
                return res.status(500).json({ message: "Failed to send OTP, please retry", success: false });
            }

            return res.status(200).json({ message: "OTP sent successfully", success: true });
        } catch (error) {
            console.error("Error in handleSendOtp:", error);
            return res.status(500).json({ message: "An error occurred", success: false });
        }
    }

    static async handleVerifyOtp(req: Request, res: Response): Promise<Response> {
        try {
            const { phoneNumber, otp } = req.body;
            if (!phoneNumber || !otp) {
                return res.status(400).json({ message: "Please provide both phone number and OTP", success: false });
            }

            const existingOtp = await OtpModel.findOne({ phoneNumber });
            if (!existingOtp) {
                return res.status(404).json({ message: "OTP not found", success: false });
            }

            if ((new Date(existingOtp.expiresAt).getTime()) < (new Date().getTime())) {
                return res.status(400).json({ message: "OTP expired", success: false });
            }

            if (otp === existingOtp.otp) {
                await OtpModel.findByIdAndDelete(existingOtp._id);
                return res.status(200).json({ message: "OTP verified successfully", success: true });
            } else {
                return res.status(401).json({ message: "Incorrect OTP", success: false });
            }
        } catch (error) {
            console.error("Error in handleVerifyOtp:", error);
            return res.status(500).json({ message: "An error occurred", success: false });
        }
    }

    static async handleLogin(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;
            console.log(email, password, "Email and password received in the backend")
            if (!email || !password) {
                return res.status(400).json({ message: "Please provide both email and password", success: false });
            }

            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User with this email not found", success: false });
            }

            const passwordMatch = await bcrypt.compare(password, user.password!);
            if (!passwordMatch) {
                return res.status(401).json({ message: "Incorrect password", success: false });
            }

            const token = AuthController.generateToken(user._id.toString());
            const data: AuthData = {
                token,
                user: {
                    email: user.email!,
                    phoneNumber: user.phoneNumber,
                }
            };

            return res.status(200).json({ data, message: "Login successful", success: true });
        } catch (error) {
            console.error("Error in handleLogin:", error);
            return res.status(500).json({ message: "An error occurred", success: false });
        }
    }

    static async handleSignup(req: Request, res: Response): Promise<Response> {
        try {
            const { phoneNumber, email, password } = req.body;
            if (!phoneNumber || !email || !password) {
                return res.status(400).json({ message: "Please provide all required fields", success: false });
            }

            const userExists = await UserModel.findOne({ $or: [{ phoneNumber }, { email }] });
            if (userExists) {
                return res.status(409).json({ message: "User with this phone number or email already exists", success: false });
            }

            const hashedPassword = await AuthController.hashPassword(password);
            const newUser = await UserModel.create({ phoneNumber, email, password: hashedPassword });
            const token = AuthController.generateToken(newUser._id.toString());

            const data: AuthData = {
                token,
                user: {
                    email: newUser.email!,
                    phoneNumber: newUser.phoneNumber,
                }
            };

            return res.status(201).json({ data, message: "User registered successfully", success: true });
        } catch (error) {
            console.error("Error in handleSignup:", error);
            return res.status(500).json({ message: "An error occurred", success: false });
        }
    }

    static async handleResetPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { phoneNumber, newPassword } = req.body;
            if (!phoneNumber || !newPassword) {
                return res.status(400).json({ message: "Phone number and new password are required", success: false });
            }

            const user = await UserModel.findOne({ phoneNumber });
            if (!user) {
                return res.status(404).json({ message: "User with this phone number does not exist", success: false });
            }

            const hashedPassword = await AuthController.hashPassword(newPassword);
            await UserModel.findByIdAndUpdate(user._id, { password: hashedPassword });

            return res.status(200).json({ message: "Password reset successfully", success: true });
        } catch (error) {
            console.error("Error in handleResetPassword:", error);
            return res.status(500).json({ message: "An error occurred", success: false });
        }
    }
}

export const { 
    handleSendOtp,
    handleVerifyOtp,
    handleLogin,
    handleSignup,
    handleResetPassword
} = AuthController;
