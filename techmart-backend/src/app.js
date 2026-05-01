const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
const authRoutes = require('./modules/auth/routes');
const categoryRoutes = require('./modules/categories/routes');
const productRoutes = require('./modules/products/routes');
const customerRoutes = require('./modules/customers/routes');
const orderRoutes = require('./modules/orders/routes');
const paymentRoutes = require('./modules/payments/routes');
const inventoryRoutes = require('./modules/inventory/routes');
const reportRoutes = require('./modules/reports/routes');

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'TechMart API is running' });
});

// Generic Error Handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
