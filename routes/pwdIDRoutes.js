import express from 'express';
import * as pwdIDControllers from '../controllers/pwdIDControllers.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';

const router = express.Router();

//router.get('/generate', authenticateToken, pwdIDControllers.getNewPwdId);

router.post('/submit', 
  authenticateToken,
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase,  
  pwdIDControllers.submitPwdId
);

router.put('/update', 
  authenticateToken,
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase,  
  pwdIDControllers.updatePwdId
);

router.get('/list', authenticateToken, pwdIDControllers.managePwdId);

router.get('/view/:pwdApplicationID', authenticateToken, pwdIDControllers.viewApplication);

router.delete('/delete/:pwdApplicationID', authenticateToken, pwdIDControllers.deleteApplication);

router.get('/get-personal-info/:populationID', authenticateToken, pwdIDControllers.getPersonDetails);

router.post('/find', authenticateToken, pwdIDControllers.findPwdID);




export default router; 