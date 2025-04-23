import express from 'express';
import * as hazzardMapController from '../controllers/hazzardMapControllers.js';
import { authenticateToken } from '../middlewares/auth.js';


const router = express.Router();

router.get('/coordinates', authenticateToken, hazzardMapController.getCoordinates);
router.get('/images', authenticateToken, hazzardMapController.getImages);
router.get('/household', authenticateToken, hazzardMapController.getHousehold);
router.get('/hazardAreas', authenticateToken, hazzardMapController.getHazardAreas);

router.post('/hazardAreas', authenticateToken, hazzardMapController.postHazardAreas);
router.put('/hazardAreas/:id', authenticateToken, hazzardMapController.putHazardAreas);
router.delete('/hazardAreas/:id', authenticateToken, hazzardMapController.deleteHazardAreas);


export default router; 