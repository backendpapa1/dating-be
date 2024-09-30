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

export interface IChat extends Document {
    participants: mongoose.Types.ObjectId[];
    messages: IMessage[];
    lastActivity: Date;
    status: 'pending' | 'accepted' | 'rejected';
    unreadCountForUser(userId: string): number; // Virtual field function for unread messages per user
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
});

// Virtual method to get unread count for a specific user
ChatSchema.methods.unreadCountForUser = function (this: IChat, userId: string): number {
    return this.messages.filter(message => !message.read && message.sender.toString() !== userId).length;
};

ChatSchema.pre('save', function (next) {
    // Update lastActivity whenever messages change
    this.lastActivity = new Date();
    next();
});

const ChatModel = mongoose.model<IChat>('Chat', ChatSchema);

export default ChatModel;
