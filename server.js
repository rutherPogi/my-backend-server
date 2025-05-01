import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import surveyRoutes from './routes/surveyRoutes.js';
import pwdIDRoutes from './routes/pwdIDRoutes.js';
import soloParentIDRoutes from './routes/soloParentIDRoutes.js';
import seniorCitizenIDRoutes from './routes/seniorCitizenIDRoutes.js';
import postRoutes from './routes/postRoutes.js';
import hazzardMapRoutes from './routes/hazzardMapRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import populationRoutes from './routes/populationRoutes.js';
import databankRoutes from './routes/databankRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

//app.use(cors());


app.use(cors({
  origin: 'https://e-tbayatmswdo.com',
  credentials: true
}));



app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/pwdID', pwdIDRoutes);
app.use('/api/soloParentID', soloParentIDRoutes);
app.use('/api/seniorCitizenID', seniorCitizenIDRoutes);
app.use('/api/posts', postRoutes );
app.use('/api/hazzardMap', hazzardMapRoutes );
app.use('/api/dashboard', dashboardRoutes );
app.use('/api/population', populationRoutes );
app.use('/api/databank', databankRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});