import { Server, Socket } from 'socket.io';
import ChatModel, { IChat, IMessage, MessageType } from '../models/chat';
import UserModel from '../models/auth';
import mongoose from 'mongoose';

class ChatController {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public initializeSocketEvents(socket: Socket): void {
    socket.on('join_chat', (chatId: string) => this.joinChat(socket, chatId));
    socket.on('leave_chat', (chatId: string) => this.leaveChat(socket, chatId));
    socket.on('send_message', (data: { chatId: string; content: string; type: MessageType; senderId: string }) => 
      this.sendMessage(socket, data));
    socket.on('typing', (data: { chatId: string; userId: string }) => this.handleTyping(socket, data));
    socket.on('stop_typing', (data: { chatId: string; userId: string }) => this.handleStopTyping(socket, data));
    socket.on('user_online', (userId: string) => this.setUserOnline(socket, userId));
    socket.on('user_offline', (userId: string) => this.setUserOffline(socket, userId));
    socket.on('get_chat_list', () => this.getChatList(socket));
    socket.on('read_messages', (chatId: string) => this.markMessagesAsRead(socket, chatId));
  }

  private async joinChat(socket: Socket, chatId: string): Promise<void> {
    try {
      const chat = await ChatModel.findById(chatId)
        .populate('participants', 'username onlineStatus');

      if (!chat) {
        socket.emit('error', 'Chat not found');
        return;
      }

      socket.join(chatId);
      socket.emit('chat_joined', chat);

      await this.markMessagesAsRead(socket, chatId);
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', 'Failed to join chat');
    }
  }

  private leaveChat(socket: Socket, chatId: string): void {
    socket.leave(chatId);
    socket.emit('chat_left', chatId);
  }

  private async sendMessage(socket: Socket, data: { chatId: string; content: string; type: MessageType; senderId: string }): Promise<void> {
    try {
      const { chatId, content, type, senderId } = data;
      const newMessage: IMessage = {
        sender: new mongoose.Types.ObjectId(senderId),
        content,
        type,
        timestamp: new Date(),
        read: false
      };

      const updatedChat = await ChatModel.findByIdAndUpdate(
        chatId,
        { 
          $push: { messages: newMessage },
          $set: { lastActivity: new Date() },
          $inc: { unreadCount: 1 }
        },
        { new: true }
      );

      if (!updatedChat) {
        socket.emit('error', 'Chat not found');
        return;
      }

      this.io.to(chatId).emit('message_received', { chatId, message: newMessage });
      this.io.emit('chat_list_update', await this.getFormattedChatList(senderId));
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  }

  private handleTyping(socket: Socket, data: { chatId: string; userId: string }): void {
    socket.to(data.chatId).emit('user_typing', data.userId);
  }

  private handleStopTyping(socket: Socket, data: { chatId: string; userId: string }): void {
    socket.to(data.chatId).emit('user_stop_typing', data.userId);
  }

  private async setUserOnline(socket: Socket, userId: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(userId, { onlineStatus: true, lastSeen: new Date() });
      socket.broadcast.emit('user_online', userId);
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  }

  private async setUserOffline(socket: Socket, userId: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(userId, { onlineStatus: false, lastSeen: new Date() });
      socket.broadcast.emit('user_offline', userId);
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }

  private async getChatList(socket: Socket): Promise<void> {
    try {
      const userId = socket.handshake.auth.userId;
      const chatList = await this.getFormattedChatList(userId);
      socket.emit('chat_list', chatList);
    } catch (error) {
      console.error('Error getting chat list:', error);
      socket.emit('error', 'Failed to get chat list');
    }
  }

  private async getFormattedChatList(userId: string): Promise<any[]> {
    const chats = await ChatModel.find({ participants: userId })
        .populate('participants', 'username onlineStatus')
        .sort({ lastActivity: -1 })
        .lean();

    return chats.map(chat => ({
        id: chat._id,
        participants: chat.participants,
        lastMessage: chat.messages[chat.messages.length - 1],
        unreadCount: chat.unreadCountForUser(userId), // Dynamic unread count per user
        lastActivity: chat.lastActivity
    }));
}

  private async markMessagesAsRead(socket: Socket, chatId: string): Promise<void> {
    try {
      const userId = socket.handshake.auth.userId;
      await ChatModel.findByIdAndUpdate(chatId, {
        $set: { 
          'messages.$[elem].read': true ,
          unreadCount: 0
        },
        // $set: { unreadCount: 0 }
      }, {
        arrayFilters: [{ 'elem.sender': { $ne: userId }, 'elem.read': false }]
      });

      socket.emit('messages_read', chatId);
      this.io.emit('chat_list_update', await this.getFormattedChatList(userId));
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', 'Failed to mark messages as read');
    }
  }
}

export default ChatController;