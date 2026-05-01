import React, { useState, useEffect } from 'react';
import Table from '../components/shared/Table';
import api from '../api/axiosInstance';
import { Search } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?search=${search}`);
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => <div className="font-medium text-gray-200">{row.name}</div>
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Phone',
      accessor: 'phone',
      cell: (row) => row.phone || <span className="text-gray-600 italic">Not provided</span>
    },
    {
      header: 'Joined Date',
      accessor: 'created_at',
      cell: (row) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Customers</h2>
        <p className="text-gray-400 mt-1">View and manage your customer base.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search customers by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-100 transition-all outline-none text-sm"
          />
        </div>
      </div>

      <Table 
        columns={columns} 
        data={customers} 
        isLoading={loading}
      />
    </div>
  );
};

export default Customers;
