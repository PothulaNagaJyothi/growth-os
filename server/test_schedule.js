"// Growth OS - Automated Scheduler Module Integration Test Suite
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Schedule = require('./models/Schedule');
const RenderedBlog = require('./models/RenderedBlog');
const Blog = require('./models/Blog');
const Campaign = require('./models/Campaign');
const Persona = require('./models/Persona');
const scheduleRoutes = require('./routes/schedule');
const initScheduleCron = require('./jobs/scheduleCron');

// Configure environment
process.env.PORT = '4600';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_32_bytes_long_minimum_length_required';

console.log('======================================================');
console.log('   GROWTH OS - AUTOMATED SCHEDULER TEST               ');
console.log('======================================================');

// Setup mock express server for isolated router testing
const app = express();
app.use(express.json());

// Mock Auth logic for testing routes
const jwt = require('jsonwebtoken');
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      console.warn('Mock JWT validation warning:', err.message);
    }
  }
  next();
});

// Mount the isolated Scheduler Router
app.use('/api/schedule', scheduleRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

let serverInstance;

const runSchedulerTests = async () => {
  const baseURL = 'http://localhost:4600/api';
  const uniqueId = Date.now();
  const testUserId = new mongoose.Types.ObjectId();
  const testCompanyId = new mongoose.Types.ObjectId
<truncated 8675 bytes>