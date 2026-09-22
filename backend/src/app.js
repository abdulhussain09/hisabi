const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { testConnection, sequelize } = require('../../database/database');
const { syncDatabase } = require('../../database/models');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const returnRoutes = require('./routes/returnRoutes');
const stockAdjustmentRoutes = require('./routes/stockAdjustmentRoutes');
const discountCodeRoutes = require('./routes/discountCodeRoutes');
const salesTargetRoutes = require('./routes/salesTargetRoutes');
const duePaymentRoutes = require('./routes/duePaymentRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const exportRoutes = require('./routes/exportRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');

const superAdminRoutes = require('./routes/superAdminRoutes');

const app = express();

// Log origins to help debug CORS
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.path} | Origin: ${req.get('origin') || 'no-origin'}`);
    next();
});

// CORS — allow requests from frontend (Vercel) or localhost in dev
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://hisabi-pos.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
}));

// Middleware - ORDER MATTERS
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// Razorpay Webhook needs RAW body for signature verification
// This must come BEFORE express.json()
app.use('/api/razorpay/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const uploadMiddleware = require('./middleware/upload');
app.use('/uploads', express.static(uploadMiddleware.uploadDir));

// Fallback for legacy uploads if missing from disk
const placeholderSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
);
app.use('/uploads', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(placeholderSvg);
});

const { authenticate, requireAdmin } = require('./middleware/auth');

// API Routes
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes); // Role checks moved inside reportRoutes
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', authenticate, requireAdmin, supplierRoutes);
app.use('/api/expenses', authenticate, requireAdmin, expenseRoutes);
app.use('/api/purchases', authenticate, requireAdmin, purchaseRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/stock-adjustments', stockAdjustmentRoutes);
app.use('/api/discount-codes', authenticate, requireAdmin, discountCodeRoutes);
app.use('/api/targets', authenticate, requireAdmin, salesTargetRoutes);
app.use('/api/due-payments', duePaymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/razorpay', razorpayRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
