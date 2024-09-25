import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    reason: String 
}, { timestamps: true })

const ReportModel = mongoose.model('Report', reportSchema);

export default ReportModel