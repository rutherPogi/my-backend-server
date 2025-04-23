import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up storage for temporary file uploads (before converting to base64)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 2. Memory storage (keeps files in memory for database storage)
const memoryStorage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create the multer middleware
const uploadToMemory = multer({ 
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    fieldSize: 20 * 1024 * 1024
  }
});

// Middleware to process uploaded file for database storage
const processImageForDatabase = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }
  
  // Files are already in memory with memoryStorage
  // We can access them via req.files array
  // Each file in the array has a buffer property
  console.log(`Processing ${req.files.length} images for database`);
  next();
};

// Handle base64 image data directly from client
const handleBase64Image = (req, res, next) => {
  // Check if we have base64 image data in the request body
  if (req.body.images && Array.isArray(req.body.images)) {
    req.files = req.body.images.map((image, index) => {
      if (image && image.base64) {
        // Convert base64 to buffer
        const base64Data = image.base64.split(';base64,').pop();
        return {
          buffer: Buffer.from(base64Data, 'base64'),
          mimetype: image.mimeType || 'image/jpeg',
          originalname: image.fileName || `image_${index}.jpg`
        };
      }
      return null;
    }).filter(Boolean); // Remove any null entries
  }
  next();
};

export { 
  uploadToMemory, 
  processImageForDatabase, 
  handleBase64Image 
};