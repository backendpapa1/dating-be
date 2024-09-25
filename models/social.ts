import mongoose from 'mongoose';

const socialSchema = new mongoose.Schema({
    facebook: { type: String, required: false },
    instagram: { type: String, required: false },
    tiktok: { type: String, required: false },
    twitter: { type: String, required: false },
    linkedIn: { type: String, required: false },
}, { timestamps: true })

const SocialModel = mongoose.model('Report', socialSchema);

export default SocialModel