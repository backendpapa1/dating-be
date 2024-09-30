import mongoose, { Document, Schema } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
}

export interface IMessage {
  sender: mongoose.Types.ObjectId;
  content: string;
  type: MessageType;
  timestamp: Date;
  read: boolean;
}

export interface IChat {
  participants: mongoose.Types.ObjectId[];
  messages: IMessage[];
  lastActivity: Date;
  status: 'pending' | 'accepted' | 'rejected';
  unreadCount: number;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

const ChatSchema = new Schema<IChat>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  messages: [MessageSchema],
  lastActivity: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  unreadCount: { type: Number, default: 0 },
});

ChatSchema.index({ participants: 1 });

const ChatModel = mongoose.model<IChat>('Chat', ChatSchema);
export default ChatModel;