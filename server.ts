import express, { Request, Response } from 'express'
import 'dotenv/config'

const app = express()

app.use("/", (req: Request, res: Response) => {
    console.log(`${req.method} ${req.url}`)
    return res.send({ message: "This is the dating app backend" })
})

const PORT = process.env.PORT!

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})