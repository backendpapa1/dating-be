import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true },
    email: { type: String, required: false },
    password: { type: String, required: false },
    onboarded: { type: String, default: false},
    birthDate: { type: Date, required: false },
    gender: { type: String, required: false },
    username: { type: String, required: false },
    relationshipGoal: { type: String, required: false },
    distancePreference: { type: String, required: false },
    interests: { type: [String], required: false },
    pictures: { type: [String], required: false },
}, { timestamps: true })

const optSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true })

export const OtpModel = mongoose.model('Otp', optSchema)

const UserModel = mongoose.model('User', userSchema)

export default UserModel