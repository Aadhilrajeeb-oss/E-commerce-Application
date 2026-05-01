import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../components/shared/Table';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import api from '../api/axiosInstance';
import { Plus, Download, FileText, ChevronRight } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'placed', label: 'Placed' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/orders?page=${page}&limit=${pagination.limit}&status=${activeTab}`);
      setOrders(res.data.data.orders);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [activeTab]);

  const fetchOrderDetails = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`);
      setSelectedOrder(res.data.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      fetchOrderDetails(id);
      fetchOrders(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed': return <Badge variant="info">Placed</Badge>;
      case 'processing': return <Badge variant="warning">Processing</Badge>;
      case 'shipped': return <Badge variant="success">Shipped</Badge>;
      case 'delivered': return <Badge variant="success">Delivered</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: 'id',
      cell: (row) => (
        <span 
          className="font-medium text-indigo-400 hover:underline cursor-pointer"
          onClick={() => fetchOrderDetails(row.id)}
        >
          {row.id.split('-')[0]}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-200">{row.customer_name}</div>
          <div className="text-xs text-gray-500">{row.customer_email}</div>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: 'created_at',
      cell: (row) => new Date(row.created_at).toLocaleDateString()
    },
    {
      header: 'Total',
      accessor: 'total_amount',
      cell: (row) => <span className="font-medium text-gray-100">${row.total_amount}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Payment',
      accessor: 'payment_status',
      cell: (row) => (
        <Badge variant={row.payment_status === 'paid' ? 'success' : 'warning'}>
          {row.payment_status}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Orders</h2>
          <p className="text-gray-400 mt-1">Manage orders, update status, and print invoices.</p>
        </div>
        <Link 
          to="/orders/create"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
        >
          <Plus size={18} />
          Create Order
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-800 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'text-indigo-400 border-indigo-500' 
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Table 
        columns={columns} 
        data={orders} 
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchOrders(page)}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Order Details">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-100">Order #{selectedOrder.id.split('-')[0]}</h3>
                <p className="text-sm text-gray-400">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(selectedOrder.status)}
                <a 
                  href={`http://localhost:5000/api/orders/${selectedOrder.id}/invoice`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                >
                  <FileText size={16} /> Invoice PDF
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
              <div>
                <span className="block text-xs text-gray-500 mb-1">Customer</span>
                <p className="font-medium text-gray-200">{selectedOrder.customer_name}</p>
                <p className="text-sm text-gray-400">{selectedOrder.customer_email}</p>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Payment</span>
                <p className="font-medium text-gray-200 capitalize">{selectedOrder.payment?.method || 'N/A'}</p>
                <Badge variant={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}>{selectedOrder.payment_status}</Badge>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Line Items</h4>
              <div className="space-y-3">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-800">
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{item.product_name}</p>
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">{item.quantity} × ${item.unit_price}</p>
                      <p className="font-semibold text-gray-100">${(item.quantity * item.unit_price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between items-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <span className="font-medium text-indigo-300">Total Amount</span>
                <span className="text-xl font-bold text-indigo-400">${selectedOrder.total_amount}</span>
              </div>
            </div>

            {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
              <div className="pt-4 border-t border-gray-800">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Update Status</h4>
                <div className="flex gap-2">
                  {selectedOrder.status === 'placed' && (
                    <button onClick={() => updateOrderStatus(selectedOrder.id, 'processing')} className="flex-1 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition">Mark Processing</button>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <button onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')} className="flex-1 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition">Mark Shipped</button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition">Mark Delivered</button>
                  )}
                  <button 
                    onClick={() => {
                      if(window.confirm('Are you sure you want to cancel this order?')) {
                        api.post(`/orders/${selectedOrder.id}/cancel`)
                           .then(() => { fetchOrderDetails(selectedOrder.id); fetchOrders(pagination.page); })
                           .catch(err => alert(err.response?.data?.message || 'Error'));
                      }
                    }} 
                    className="flex-1 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition border border-rose-500/20"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
