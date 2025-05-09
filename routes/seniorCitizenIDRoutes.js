// routes/surveyRoutes.js - Survey routes
import express from 'express';
import * as seniorCitizenIDControllers from '../controllers/seniorCitizenIDControllers.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';

const router = express.Router();

router.get('/generate', authenticateToken, seniorCitizenIDControllers.getNewSeniorCitizenId);

router.post('/submit',     
  authenticateToken,
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase, 
  seniorCitizenIDControllers.submitSeniorCitizenID
);

router.put('/update',     
  authenticateToken,
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase, 
  seniorCitizenIDControllers.updateSeniorCitizenID
);

router.get('/list', authenticateToken, seniorCitizenIDControllers.manageSeniorCitizenId);

router.get('/view/:scApplicationID', authenticateToken, seniorCitizenIDControllers.viewApplication);

router.delete('/delete/:populationID/:scApplicationID', authenticateToken, seniorCitizenIDControllers.deleteApplication);

router.get('/get-personal-info/:populationID', authenticateToken, seniorCitizenIDControllers.getPersonDetails);

router.post('/find', authenticateToken, seniorCitizenIDControllers.findID);

export default router; 