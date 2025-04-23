// routes/surveyRoutes.js - Survey routes
import express from 'express';
import * as soloParentIDControllers from '../controllers/soloParentIDControllers.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';

const router = express.Router();

router.get('/generate', authenticateToken, soloParentIDControllers.getNewSoloParentId);

router.post('/submit', 
  authenticateToken, 
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase,  
  soloParentIDControllers.submitSoloParentID
);

router.put('/update', 
  authenticateToken, 
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase,  
  soloParentIDControllers.updateSoloParentID
);

router.get('/list', authenticateToken, soloParentIDControllers.manageSoloParentId);

router.get('/view/:spApplicationID', authenticateToken, soloParentIDControllers.viewApplication);

router.delete('/delete/:spApplicationID', authenticateToken, soloParentIDControllers.deleteApplication);

router.get('/get-personal-info/:populationID', authenticateToken, soloParentIDControllers.getPersonDetails);

router.post('/find', authenticateToken, soloParentIDControllers.findID);

export default router; 