require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB, ensureDefaultAdmin } = require('./config/db');
const { startCronJobs } = require('./config/cron');
const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const referralRoutes = require('./routes/referralRoutes');
const roiRoutes = require('./routes/roiRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 5000);

const startServer = async (port = DEFAULT_PORT) => {
  await connectDB();
  await ensureDefaultAdmin();
  startCronJobs();

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = port + 1;
      console.warn(`Port ${port} is busy. Retrying on ${fallbackPort}.`);
      await startServer(fallbackPort);
      return;
    }

    console.error('Server failed to start:', error.message);
    process.exit(1);
  });
};

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  })
);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Investment platform API is running.', data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/roi', roiRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong.',
    errors: err.errors || [],
  });
});

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
