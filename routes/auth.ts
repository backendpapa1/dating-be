import express from 'express'
import { handleLogin, handleResetPassword, handleSendOtp, handleSignup, handleVerifyOtp } from '../controllers/auth'

const router = express.Router()

router.post("/send-otp", handleSendOtp)

router.post("/verify-otp", handleVerifyOtp)

router.post("/signup", handleSignup)

router.post("/login", handleLogin)

router.post("/reset-password", handleResetPassword)

export default router
