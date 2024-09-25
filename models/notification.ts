import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    title: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    reason: String 
}, { timestamps: true })

const NotificationModel = mongoose.model('Notification', notificationSchema);

export default NotificationModel