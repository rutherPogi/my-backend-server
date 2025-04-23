// routes/surveyRoutes.js - Survey routes
import express from 'express';
import * as populationController from '../controllers/populationController.js';
import { authenticateToken } from '../middlewares/auth.js';


const router = express.Router();


router.get('/get', authenticateToken, populationController.managePopulation);

export default router; 