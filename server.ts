import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { verifyJWT } from './middlewares/verify-jwt';
import authRouter from './routes/auth';
import onboardingRouter from './routes/onboarding';
import uploadRouter from './routes/upload';
import chatRoutes from './routes/chat';
import ChatController from './controllers/chat';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use("/auth", authRouter);
app.use(verifyJWT);
app.use("/onboarding", onboardingRouter);
app.use("/upload", uploadRouter);
app.use('/chats', chatRoutes);

// Root route for basic check
app.use("/", (req: Request, res: Response) => {
  console.log(`${req.method} ${req.url}`);
  return res.send({ message: "This is the dating app backend" });
});

// MongoDB connection
const startApp = async () => {
  try {
    const connect = await mongoose.connect(process.env.DATABASE_URI!);
    if (connect) {
      console.log("Connected to the database");

      // Socket.IO setup
      const chatController = new ChatController(io);
      
      io.on('connection', (socket) => {
        console.log('A user connected');
        chatController.initializeSocketEvents(socket);

        socket.on('disconnect', () => {
          console.log('User disconnected');
        });
      });

      // Start the server
      const port = process.env.PORT || 3000;
      server.listen(port, () => console.log(`Server listening on port: ${port}`));
    } else {
      console.log("Unable to connect to the database");
    }
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

startApp();
