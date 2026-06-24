const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  const conn = await require('./config/db')();
  return conn;
};

// Import custom middleware & routes
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const personaRoutes = require('./routes/persona');
const topicRoutes = require('./routes/topic');
const knowledgeRoutes = require('./routes/knowledge');
const researchRoutes = require('./routes/research');
const blogRoutes = require('./routes/blog');
const calendarRoutes = require('./routes/calendar');
const initSchedulerJobs = require('./jobs/schedulerJob');
const seedPlatforms = require('./config/platformSeed');

// Connect to MongoDB Atlas database
connectDB().then(() => {
  initSchedulerJobs();
  seedPlatforms();
});

const app = express();

// Security and utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: '*', // Adjust under production
  credentials: true,
}));
app.use(express.json());

// Serve static uploads files for local fallback storage engine
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'Healthy',
    timestamp: new Date(),
    service: 'Growth OS API Engine',
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/seo', require('./routes/seo'));
app.use('/api/render', require('./routes/render'));
app.use('/api/images', require('./routes/image'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/telemetry', require('./routes/telemetry'));
app.use('/api/credits', require('./routes/credits'));

// Register Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`Growth OS Server successfully active in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
