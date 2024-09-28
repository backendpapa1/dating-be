import express from 'express'
import relationshipController from '../controllers/relationship';

const router = express.Router()

router.post('/like', relationshipController.handleLike);

router.post('/superlike', relationshipController.handleSuperlike);

router.post('/dislike', relationshipController.handleDislike);

router.post('/undo', relationshipController.handleUndo);

router.get('/status/:targetUserId', relationshipController.getRelationshipStatus);

export default router