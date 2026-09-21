import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import leagueRoutes from './routes/leagueRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import postRoutes from './routes/postRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const conn = await connectDB();
    console.log(`MongoDB connected: ${conn.connection.host}`);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  process.env.FRONTEND_URL,
  'https://kwathu-delta.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Kwathu API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      listings: '/api/listings',
      news: '/api/news',
      events: '/api/events',
      leagues: '/api/leagues',
      posts: '/api/posts',
      comments: '/api/comments',
      messages: '/api/messages',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

startServer();
