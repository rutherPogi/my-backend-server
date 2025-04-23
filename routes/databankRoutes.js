// routes/surveyRoutes.js - Survey routes
import express from 'express';
import * as databankController from '../controllers/databankController.js';
import { authenticateToken } from '../middlewares/auth.js';


const router = express.Router();

router.get('/segregation/:sex', authenticateToken, databankController.getSegregation);
router.get('/segregation/total/:sex', authenticateToken, databankController.getSegregationTotal);

router.get('/youth/masterlist/:barangay', authenticateToken, databankController.getYouthMasterlist);
router.get('/youth/osy/:barangay', authenticateToken, databankController.getOSY);

router.get('/solo-parent/:barangay', authenticateToken, databankController.getSoloParent);

router.get('/women/masterlist/:barangay', authenticateToken, databankController.getWomenMasterlist);

router.get('/pwd/masterlist/:barangay', authenticateToken, databankController.getPWD);

router.get('/non-ivatan/masterlist/:barangay', authenticateToken, databankController.getNonIvatan);

export default router; 