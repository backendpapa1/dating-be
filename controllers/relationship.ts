import { Request, Response } from 'express';
import { CustomRequest } from '../middlewares/verify-jwt';
import { RelationshipModel, RelationshipStatus, IRelationship } from '../models/relationship';
import mongoose from 'mongoose';

class RelationshipController {
    private async updateRelationship(
        userId: mongoose.Types.ObjectId,
        targetUserId: mongoose.Types.ObjectId,
        status: RelationshipStatus
    ): Promise<IRelationship> {
        return await RelationshipModel.findOneAndUpdate(
            { user: userId, targetUser: targetUserId },
            { status },
            { upsert: true, new: true }
        );
    }

    public handleLike = async (req: Request, res: Response): Promise<void> => {
        await this.handleRelationshipUpdate(req, res, RelationshipStatus.Liked);
    }

    public handleSuperlike = async (req: Request, res: Response): Promise<void> => {
        await this.handleRelationshipUpdate(req, res, RelationshipStatus.Superliked);
    }

    public handleDislike = async (req: Request, res: Response): Promise<void> => {
        await this.handleRelationshipUpdate(req, res, RelationshipStatus.Disliked);
    }

    public hanldeBlock = async (req: Request, res: Response): Promise<void> => {
        await this.handleRelationshipUpdate(req, res, RelationshipStatus.Blocked)
    }

    public handleUndo = async (req: Request, res: Response): Promise<void> => {
        await this.handleRelationshipUpdate(req, res, RelationshipStatus.None);
    }

    private async handleRelationshipUpdate(req: Request, res: Response, status: RelationshipStatus): Promise<void> {
        try {
            const userId = (req as CustomRequest).token?.id;
            const { targetUserId } = req.body;

            if (!targetUserId) {
                res.status(400).json({
                    message: "Target user ID is required",
                    success: false
                });
                return;
            }

            const updatedRelationship = await this.updateRelationship(
                userId,
                targetUserId,
                status
            );

            res.status(200).json({
                message: `Relationship updated successfully`,
                data: {
                    payload: updatedRelationship
                },
                success: true
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "An error occurred while updating the relationship",
                success: false
            });
        }
    }

    public getRelationshipStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as CustomRequest).token?.id;
            const { targetUserId } = req.params;

            if (!targetUserId) {
                res.status(400).json({
                    message: "Target user ID is required",
                    success: false
                });
                return;
            }

            const relationship = await RelationshipModel.findOne({
                user: userId,
                targetUser: targetUserId
            });

            res.status(200).json({
                message: "Relationship status retrieved successfully",
                data: {
                    payload: relationship ? relationship.status : RelationshipStatus.None
                },
                success: true
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "An error occurred while retrieving the relationship status",
                success: false
            });
        }
    }
}

export default new RelationshipController();