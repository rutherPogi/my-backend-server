import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/getTotal', dashboardController.getTotal);
router.get('/barangayStats', dashboardController.getBarangayStats);




export default router; 