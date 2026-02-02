import express from 'express';
import * as electionController from '../controllers/electionController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/Student routes
router.get('/', verifyToken, electionController.getElection);
router.post('/vote', verifyToken, checkRole(['Student']), electionController.vote);
router.post('/manifesto', verifyToken, checkRole(['Student']), electionController.updateManifesto);

// Admin routes
router.post('/start', verifyToken, checkRole(['Admin']), electionController.startElection);
router.post('/stop', verifyToken, checkRole(['Admin']), electionController.stopElection);
router.post('/nominate', verifyToken, checkRole(['Admin']), electionController.nominateCandidate);
router.delete('/nominate/:candidateId', verifyToken, checkRole(['Admin']), electionController.removeCandidate);

export default router;
