import express from 'express'
import { handleCheckOnboardingState, handleMultiStepOnboarding } from '../controllers/onboarding'

const router = express.Router()

router.patch("/", handleMultiStepOnboarding)

router.get("/", handleCheckOnboardingState)

export default router