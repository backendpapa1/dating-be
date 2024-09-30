import { Request, Response } from 'express';
import { CustomRequest } from '../middlewares/verify-jwt';
import UserModel from '../models/auth';
import mongoose from 'mongoose';

interface FilterOptions {
    maxDistance?: number;
    minAge?: number;
    maxAge?: number;
    minPictures?: number;
    gender?: string;
    relationshipGoal?: string;
    interests?: string[];
    hasAbout?: boolean;
}

interface SearchOptions {
    searchText?: string;
}

class MatchController {
    private async buildFilterQuery(userId: string, options: FilterOptions): Promise<any> {
        const currentUser = await UserModel.findById(userId);
        if (!currentUser) {
            throw new Error('Current user not found');
        }

        const query: any = { _id: { $ne: userId } };

        if (options.maxDistance) {
            // Don't forget to handle the location stuff here.
        }

        if (options.minAge || options.maxAge) {
            const today = new Date();
            if (options.minAge) {
                query.birthDate = { $lte: new Date(today.getFullYear() - options.minAge, today.getMonth(), today.getDate()) };
            }
            if (options.maxAge) {
                query.birthDate = { 
                    ...query.birthDate,
                    $gte: new Date(today.getFullYear() - options.maxAge, today.getMonth(), today.getDate())
                };
            }
        }

        if (options.minPictures) {
            query.pictures = { $exists: true, $size: { $gte: options.minPictures } };
        }

        if (options.gender) {
            query.gender = options.gender;
        }

        if (options.relationshipGoal) {
            query.relationshipGoal = options.relationshipGoal;
        }

        if (options.interests && options.interests.length > 0) {
            query.interests = { $in: options.interests };
        }

        if (options.hasAbout) {
            query.about = { $exists: true, $ne: '' };
        }

        return query;
    }

    private buildSearchQuery(options: SearchOptions): any {
        const searchQuery: any = {};
        if (options.searchText) {
            const searchRegex = new RegExp(options.searchText, 'i');
            searchQuery.$or = [
                { username: searchRegex },
                { company: searchRegex },
                { jobTitle: searchRegex },
                { livingIn: searchRegex }
            ];
        }
        return searchQuery;
    }

    public findMatches = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as CustomRequest).token?.id;
            const filterOptions: FilterOptions = req.body.filterOptions || {};
            const searchOptions: SearchOptions = req.body.searchOptions || {};

            const filterQuery = await this.buildFilterQuery(userId, filterOptions);
            const searchQuery = this.buildSearchQuery(searchOptions);

            const combinedQuery = { $and: [filterQuery, searchQuery] };

            const matches = await UserModel.find(combinedQuery).select('-password');

            // Group results for frontend display
            const groupedMatches = {
                byUsername: matches.filter(user => user.username?.match(new RegExp(searchOptions.searchText || '', 'i'))),
                byCompany: matches.filter(user => user.company?.match(new RegExp(searchOptions.searchText || '', 'i'))),
                byJobTitle: matches.filter(user => user.jobTitle?.match(new RegExp(searchOptions.searchText || '', 'i'))),
                byLocation: matches.filter(user => user.livingIn?.match(new RegExp(searchOptions.searchText || '', 'i'))),
                other: matches.filter(user => 
                    !(user.username?.match(new RegExp(searchOptions.searchText || '', 'i')) ||
                      user.company?.match(new RegExp(searchOptions.searchText || '', 'i')) ||
                      user.jobTitle?.match(new RegExp(searchOptions.searchText || '', 'i')) ||
                      user.livingIn?.match(new RegExp(searchOptions.searchText || '', 'i')))
                )
            };

            res.status(200).json({
                message: "Matches found successfully",
                data: {
                    payload: groupedMatches
                },
                success: true
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "An error occurred while finding matches",
                success: false
            });
        }
    }
}

export default new MatchController();