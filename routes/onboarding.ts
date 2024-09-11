import express from 'express'
import { handleOnboarding } from '../controllers/onboarding'

const router = express.Router()

router.patch("/", handleOnboarding)

export default router