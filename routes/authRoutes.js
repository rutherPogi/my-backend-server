// routes/authRoutes.js - Authentication routes
import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post("/add-account", authController.addAccount);
router.post("/register-batch", authController.registerBatch);
router.post("/login", authController.login);

router.get('/manage-accounts', authenticateToken, authController.manageAccounts);
router.delete('/delete-account/:userID', authenticateToken, authController.deleteAccount);
router.get('/last-sequence', authController.getLastSequence);

router.put('/users/:userID', authenticateToken, authController.updateUserProfile);
router.put('/users/:userID/password', authenticateToken, authController.changePassword);



export default router;