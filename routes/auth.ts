import express from 'express'
import { handleLogin, handleResetPasswword, handleSendOtp, handleSignup, handleVerifyOtp } from '../controllers/auth'

const router = express.Router()

router.post("/send-otp", handleSendOtp)

router.post("/verify-otp", handleVerifyOtp)

router.post("/signup", handleSignup)

router.post("/login", handleLogin)

router.post("/reset-password", handleResetPasswword)

export default router
