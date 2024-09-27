import express from 'express'
import { handleFileUpload } from '../utils/upload'

const router = express.Router()

router.post("/", handleFileUpload)

export default router