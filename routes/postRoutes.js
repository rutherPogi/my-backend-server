import express from 'express';
import * as postController from '../controllers/postController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';

const router = express.Router();


router.get('/getPosts', postController.getPosts);
router.get('/getPostImages', postController.getImages);

router.get('/get/:id', postController.getPostById);
router.get('/get/:id/images', postController.getPostImages);


router.post('/add', 
  authenticateToken, 
  uploadToMemory.array('image', 10),
  processImageForDatabase,
  postController.createPost
);

router.put('/update/:postID',
  authenticateToken,
  uploadToMemory.array('image', 10),
  processImageForDatabase,
  postController.updatePost
);

router.delete('/delete/:id', authenticateToken, postController.deletePost);
router.post('/delete-multiple', authenticateToken, postController.deleteMultiplePosts);



export default router; 