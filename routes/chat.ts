import express from 'express';
import { CustomRequest, verifyJWT } from '../middlewares/verify-jwt';
import ChatModel from '../models/chat';
import { Types } from 'mongoose';

const router = express.Router();

// Get all chats for a user
router.get('/', verifyJWT, async (req, res) => {
  try {
    const userId = (req as CustomRequest)?.token?.id;
    const chats = await ChatModel.find({ participants: userId })
      .populate('participants', 'username profilePicture')
      .sort({ lastActivity: -1 })
      .lean();

    const formattedChats = chats.map(chat => ({
      id: chat._id,
      participants: chat.participants,
      lastMessage: chat.messages[chat.messages.length - 1],
      unreadCount: chat.unreadCount,
      lastActivity: chat.lastActivity
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
});

// Get a single chat by ID
router.get('/:chatId', verifyJWT, async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = (req as CustomRequest)?.token?.id;

    const chat = await ChatModel.findOne({
      _id: chatId,
      participants: userId
    }).populate('participants', 'username profilePicture');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
});

// Mark messages as read
router.post('/:chatId/read', verifyJWT, async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = (req as CustomRequest)?.token?.id;

    const updatedChat = await ChatModel.findOneAndUpdate(
      { _id: chatId, participants: userId },
      { 
        $set: { 
          'messages.$[elem].read': true,
           unreadCount: 0
        },
        // $set: { unreadCount: 0 }
      },
      {
        arrayFilters: [{ 'elem.sender': { $ne: userId }, 'elem.read': false }],
        new: true
      }
    );

    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

export default router;