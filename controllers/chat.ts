import { Server, Socket } from 'socket.io';
import ChatModel, { IChat, IMessage, MessageType } from '../models/chat';
import UserModel from '../models/auth';
import mongoose from 'mongoose';

interface ServerToClientEvents {
  chatSessionCreated: (data: { chatSession: string }) => void;
  messageFailed: (data: { info: string }) => void;
  message: (data: { messageId: string, sender: string, receiver: string, type: string, content: string }) => void;
  globalMessage: (data: { messageId: string, sender: string, receiver: string, type: string, content: string }) => void;
  typing: (data: { sender: string, status: boolean }) => void;
  stopTyping: (data: { sender: string, status: boolean }) => void;
}

interface ClientToServerEvents {
  registerUser: (data: { userId: string }) => void;
  createChat: (data: { userId1: string, userId2: string }) => void;
  message: (newMessage: any) => void;
  typing: (data: { sender: string, receiver: string }) => void;
  stopTyping: (data: { sender: string, receiver: string }) => void;
}

class ChatController {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private socketMap: {[key: string]: string} = {};

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public initializeSocketEvents(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    socket.on("registerUser", (data) => this.registerUser(socket, data));
    socket.on("createChat", (data) => this.createChat(data));
    socket.on("message", (data) => this.handleMessage(data));
    socket.on("typing", (data) => this.handleTyping(data));
    socket.on("stopTyping", (data) => this.handleStopTyping(data));
    socket.on("disconnect", () => this.handleDisconnect(socket));
  }

  private registerUser(socket: Socket, data: { userId: string }): void {
    const { userId } = data;
    this.socketMap[userId] = socket.id;
    console.log(`User with id ${userId} registered with socket ${socket.id}`);
  }

  public async createChat(data: { userId1: string, userId2: string }): Promise<void> {
    const { userId1, userId2 } = data;
    console.log(`userId1: ${userId1} and userId2: ${userId2} created a new chat`);
    const newSession = await this.createChatSession(userId1, userId2);
    this.io.to([this.socketMap[userId1], this.socketMap[userId2]]).emit("chatSessionCreated", { chatSession: newSession.toString() });
  }

  private async handleMessage(data: { sender: string, receiver: string, type: MessageType, content: string }): Promise<void> {
    const { sender, receiver, type, content } = data;
    console.log(`sender: ${sender}, receiver: ${receiver}, type: ${type}, content: ${content}`);
    
    const newMessage = await this.createMessage(sender, receiver, type, content);
    // @ts-ignore
    if (!newMessage?._id) {
      this.io.to(this.socketMap[sender]).emit("messageFailed", { info: "Failed to create message" });
      return;
    }

    const messageData = {
        // @ts-ignore
      messageId: newMessage._id.toString(),
      sender,
      receiver,
      type,
      content
    };

    if (this.socketMap[receiver]) {
      this.io.to(this.socketMap[sender]).emit("message", messageData);
      this.io.to(this.socketMap[sender]).emit("globalMessage", messageData);
      this.io.to(this.socketMap[receiver]).emit("message", messageData);
      this.io.to(this.socketMap[receiver]).emit("globalMessage", messageData);
    } else if (this.socketMap[sender]) {
      this.io.to(this.socketMap[sender]).emit("message", messageData);
      this.io.to(this.socketMap[sender]).emit("globalMessage", messageData);
    }
  }

  private handleTyping(data: { sender: string, receiver: string }): void {
    const { sender, receiver } = data;
    if (this.socketMap[receiver]) {
      this.io.to(this.socketMap[receiver]).emit("typing", { sender, status: true });
    }
  }

  private handleStopTyping(data: { sender: string, receiver: string }): void {
    const { sender, receiver } = data;
    if (this.socketMap[receiver]) {
      this.io.to(this.socketMap[receiver]).emit("stopTyping", { sender, status: false });
    }
  }

  private handleDisconnect(socket: Socket): void {
    console.log('User disconnected');
    for (const key in this.socketMap) {
      if (this.socketMap[key] === socket.id) {
        delete this.socketMap[key];
      }
    }
  }

  public async createChatSession(userId1: string, userId2: string): Promise<mongoose.Types.ObjectId> {
    const existingChat = await ChatModel.findOne({
      participants: { $all: [userId1, userId2] }
    });

    if (existingChat) {
        
      return existingChat._id;
    }

    const newChat = new ChatModel({
      participants: [userId1, userId2],
      messages: [],
      lastActivity: new Date(),
      status: 'pending'
    });

    await newChat.save();
    return newChat._id;
  }

  public async createMessage(sender: string, receiver: string, type: MessageType, content: string): Promise<IMessage> {
    let chat = await ChatModel.findOne({ participants: { $all: [sender, receiver] } });
    
    if (!chat) {
      const chatId = await this.createChatSession(sender, receiver);
      chat = await ChatModel.findById(chatId);
    }

    if (!chat) {
      throw new Error("Failed to create or find chat");
    }

    const newMessage: IMessage = {
      sender: new mongoose.Types.ObjectId(sender),
      content,
      type,
      timestamp: new Date(),
      read: false
    };

    chat.messages.push(newMessage);
    chat.lastActivity = new Date();
    chat.unreadCount += 1;
    await chat.save();

    return newMessage;
  }
}

export default ChatController;