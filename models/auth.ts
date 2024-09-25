import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    // Personal Informations
    phoneNumber: { type: String, required: true },
    email: { type: String, required: false },
    password: { type: String, required: false },
    onboarded: { type: Boolean, default: false},
    lastOnboardingStep: { type: Number, default: false },
    birthDate: { type: Date, required: false },
    gender: { type: String, required: false },
    username: { type: String, required: false },
    relationshipGoal: { type: String, required: false },
    distancePreference: { type: String, required: false },
    interests: { type: [String], required: false },
    pictures: { type: [String], required: false },
    // Extended personal info
    weight: { type: String, default: false},
    height: { type: Date, required: false },
    jobTitle: { type: String, required: false },
    company: { type: String, required: false },
    livingIn: { type: String, default: false},
    school: { type: Date, required: false },
    about: { type: String, required: false },
    religion:  { type: String, required: false },
    // Functional Informations
    likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    superlikedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reports' }],
}, { timestamps: true })

const optSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true })

export const OtpModel = mongoose.model('Otp', optSchema)

const UserModel = mongoose.model('User', userSchema)

export default UserModel