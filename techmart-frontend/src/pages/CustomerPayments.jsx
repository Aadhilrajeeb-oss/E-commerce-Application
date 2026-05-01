import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import Badge from '../components/shared/Badge';
import { CreditCard, Calendar, Hash, ArrowRight } from 'lucide-react';

const CustomerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get('/payments/history');
        setPayments(res.data.data);
      } catch (err) {
        console.error('Error fetching payments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Financial Records</h1>
        <p className="text-gray-500">View and manage your transaction history and payment receipts.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Transaction</th>
                <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Order Ref</th>
                <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-gray-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-400 transition-colors">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Stripe Card</p>
                          <p className="text-xs text-gray-600 font-mono">ID: {payment.stripe_payment_id.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-300">
                        <Hash className="w-4 h-4 text-gray-600" />
                        <span className="font-mono">{payment.order_id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-white">${parseFloat(payment.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Badge variant={payment.status}>{payment.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Secure Billing</h4>
            <p className="text-sm text-gray-500">All transactions are processed through Stripe with end-to-end encryption.</p>
          </div>
        </div>
        <button className="px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center space-x-2 hover:bg-gray-200 transition-all">
          <span>Manage Payment Methods</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CustomerPayments;
