import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';
import Reports from './pages/Reports';

import CustomerLayout from './components/layout/CustomerLayout';
import CustomerLogin from './pages/CustomerLogin';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerStore from './pages/CustomerStore';
import CustomerPayments from './pages/CustomerPayments';
import Checkout from './pages/Checkout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/create" element={<CreateOrder />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>

        {/* Customer Routes */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route element={<CustomerLayout />}>
            <Route path="/customer/store" element={<CustomerStore />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/payments" element={<CustomerPayments />} />
            <Route path="/customer/checkout" element={<Checkout />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/customer/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
