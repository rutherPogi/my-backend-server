// routes/surveyRoutes.js - Survey routes
import express from 'express';
import * as surveyController from '../controllers/surveyController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';

const router = express.Router();

router.get('/generate', authenticateToken, surveyController.newSurveyID);

router.post('/submit', 
  authenticateToken, 
  uploadToMemory.array('houseImages', 10),
  processImageForDatabase,
  surveyController.submitSurvey
);

router.put('/update', 
  authenticateToken, 
  uploadToMemory.array('houseImages', 10),
  processImageForDatabase,
  surveyController.updateSurvey
);

router.get('/list', authenticateToken, surveyController.listSurvey);

router.get('/view/:surveyID', authenticateToken, surveyController.viewSurvey);

router.delete('/delete/:surveyID/:populationID', authenticateToken, surveyController.deleteSurvey);



export default router; 