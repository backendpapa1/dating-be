import express, { Request, Response } from 'express'
import 'dotenv/config'
import bodyParser from 'body-parser'
import cors from 'cors'
import authRouter from './routes/auth'
import mongoose from 'mongoose'
import { verifyJWT } from './middlewares/verify-jwt'
import onboardingRouter from './routes/onboarding'

const app = express()

app.use(bodyParser.json())

app.use(cors())


app.use("/auth", authRouter)

app.use(verifyJWT)

app.use("/onboarding", onboardingRouter)

app.use("/", (req: Request, res: Response) => {
    console.log(`${req.method} ${req.url}`)
    return res.send({ message: "This is the dating app backend" })
})

const port: string = process.env.PORT!

const startApp = async () => {
    try {
      const connect = await mongoose.connect(process.env.DATABASE_URI!)
      if(connect) {
        console.log("connected to the database")
        app.listen(port, () => console.log(`Server listening on port: ${port}`))
      } else {
        console.log("unable to connect to database")
      }
    } catch (error) {
      throw error
    }
  }
  startApp()