import express from 'express';
import * as electionController from '../controllers/electionController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { cacheMiddleware, CacheKeys } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public/Student routes with Redis caching
router.get('/', verifyToken, cacheMiddleware(CacheKeys.election, 60), electionController.getElection);
router.post('/vote', verifyToken, checkRole(['student']), electionController.vote);
router.post('/manifesto', verifyToken, checkRole(['Student']), electionController.updateManifesto);

// Admin routes
router.post('/start', verifyToken, checkRole(['Admin', "college_admin"]), electionController.startElection);
router.post('/stop', verifyToken, checkRole(['Admin', "college_admin"]), electionController.stopElection);
router.post('/nominate', verifyToken, checkRole(['Admin', "college_admin"]), electionController.nominateCandidate);
router.delete('/nominate/:candidateId', verifyToken, checkRole(['Admin', "college_admin"]), electionController.removeCandidate);

export default router;
