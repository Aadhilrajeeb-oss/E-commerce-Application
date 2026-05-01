import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import Badge from '../components/shared/Badge';
import { Package, Calendar, DollarSign, ArrowRight, ExternalLink } from 'lucide-react';

const CustomerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalSpent: 0, orderCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const [ordersRes] = await Promise.all([
          axios.get('/orders'), // Assuming the backend filters orders by the logged-in user's customer_id
        ]);
        
        const customerOrders = ordersRes.data.data.orders || [];
        setOrders(customerOrders);
        
        const totalSpent = customerOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        setStats({
          totalSpent,
          orderCount: customerOrders.length
        });
      } catch (err) {
        console.error('Error fetching customer data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">My Experience</h1>
          <p className="text-gray-500">Track your premium acquisitions and membership status.</p>
        </div>
        
        <div className="flex space-x-4">
          <div className="px-6 py-4 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-sm">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Total Value</p>
            <p className="text-2xl font-bold text-white">${stats.totalSpent.toLocaleString()}</p>
          </div>
          <div className="px-6 py-4 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-sm">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Orders</p>
            <p className="text-2xl font-bold text-white">{stats.orderCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Package className="w-5 h-5 text-indigo-400" />
          <span>Recent Orders</span>
        </h2>
        
        {orders.length === 0 ? (
          <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-12 text-center">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">No orders found. Begin your journey in our store.</p>
            <button className="mt-6 text-indigo-400 font-semibold hover:text-indigo-300">Browse Products →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-3xl p-6 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
              >
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Package className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order ID: {order.id.slice(0, 8)}...</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-white">${parseFloat(order.total_amount).toLocaleString()}</span>
                      <Badge variant={order.status}>{order.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Placed On</p>
                    <div className="flex items-center justify-end space-x-2 text-sm text-gray-300">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    {order.payment_status === 'paid' ? (
                      <button className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    ) : (
                      <button className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20">
                        <span>Pay Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
