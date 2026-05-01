import React from 'react';
import StatCard from '../components/shared/StatCard';
import { DollarSign, ShoppingCart, AlertTriangle, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 6890 },
  { name: 'Sat', revenue: 8390 },
  { name: 'Sun', revenue: 7490 },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Dashboard Overview</h2>
        <p className="text-gray-400 mt-1">Here's what's happening in your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value="$34,500" icon={DollarSign} trend={{ value: 12, isPositive: true }} />
        <StatCard title="Total Orders" value="1,240" icon={ShoppingCart} trend={{ value: 8, isPositive: true }} />
        <StatCard title="Low Stock Items" value="15" icon={AlertTriangle} trend={{ value: 3, isPositive: false }} />
        <StatCard title="Active Customers" value="892" icon={Users} trend={{ value: 5, isPositive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-gray-100 mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#F3F4F6' }}
                  itemStyle={{ color: '#818CF8' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-gray-100 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                <div>
                  <p className="text-sm text-gray-300">New order <span className="font-medium text-gray-100">#ORD-{1000+i}</span> placed</p>
                  <p className="text-xs text-gray-500 mt-1">{i * 2} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
