import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    discoveryPreference: { type: mongoose.Types.ObjectId, ref: "DiscoveryPreference" },
    profilePrivacy: { type: mongoose.Types.ObjectId, ref: "ProfilePrivacy" },
}, { timestamps: true })

const SettingsModel = mongoose.model("Setting", settingsSchema)


const discoveryPreferenceSchema = new mongoose.Schema({
    location: { type: String, required: true },
    goGlobal: { type: Boolean, required: true },
    distanceRange: { type: Number, required: true },
    ageRange: [{ type: Number, required: true }],
})

export const DiscoveryPreferenceModel = mongoose.model("DiscoveryPreference", discoveryPreferenceSchema)

const profilePrivacySchema = new mongoose.Schema({
    visibility: { type: String, required: true },
    privacyMode: { type: Boolean, required: true },
    activeStatus: { type: Number, required: true },
})

export const ProfilePrivacyModel = mongoose.model("ProfilePrivacy", profilePrivacySchema)



export default SettingsModel