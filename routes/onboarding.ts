import express from 'express'
import { handleMultiStepOnboarding } from '../controllers/onboarding'

const router = express.Router()

router.patch("/", handleMultiStepOnboarding)

export default router