import mongoose, { Schema, Document } from 'mongoose';

enum RelationshipStatus {
    Liked = 'liked',
    Superliked = 'superliked',
    Disliked = 'disliked',
    Blocked = 'blocked',
    None = 'none'
}

interface IRelationship extends Document {
    user: mongoose.Types.ObjectId;
    targetUser: mongoose.Types.ObjectId;
    status: RelationshipStatus;
    createdAt: Date;
    updatedAt: Date;
}

const RelationshipSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(RelationshipStatus), default: RelationshipStatus.None },
}, { timestamps: true });

// Ensure that there's only one relationship between two users
RelationshipSchema.index({ user: 1, targetUser: 1 }, { unique: true });

const RelationshipModel = mongoose.model<IRelationship>('Relationship', RelationshipSchema);

export { RelationshipModel, RelationshipStatus, IRelationship };