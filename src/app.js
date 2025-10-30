import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import debugMailRoutes from './routes/debugMailRoutes.js';
import aiRoutes from './routes/ai.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const allowedOrigins = [
  'http://localhost:5173',
  'https://happenly-frontend.onrender.com'
];


// app.use(cors({
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     credentials: true,
//   }));

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  credentials: true,
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/debug-mail', debugMailRoutes);
app.use('/api/v1/ai', aiRoutes);
app.get('/', (_, res) => res.send('Happennly API running'));



export default app;
