import React, { useState, useEffect } from 'react';
import Table from '../components/shared/Table';
import Badge from '../components/shared/Badge';
import api from '../api/axiosInstance';
import { Search, Plus, DownloadCloud, Loader2 } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/products?page=${page}&limit=${pagination.limit}&search=${search}`);
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleImport = async () => {
    try {
      setImporting(true);
      await api.post('/products/import-external');
      fetchProducts(1);
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0">
            {row.images?.length > 0 && <img src={row.images[0]} alt={row.name} className="w-full h-full object-cover" />}
          </div>
          <div>
            <div className="font-medium text-gray-200">{row.name}</div>
            <div className="text-xs text-gray-500">{row.sku}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row) => `$${row.price}`
    },
    {
      header: 'Stock',
      accessor: 'stock_quantity',
      cell: (row) => {
        let variant = 'success';
        if (row.stock_quantity < 10) variant = 'danger';
        else if (row.stock_quantity < 20) variant = 'warning';
        return <Badge variant={variant}>{row.stock_quantity} in stock</Badge>;
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : row.status === 'draft' ? 'warning' : 'default'}>
          {row.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Products</h2>
          <p className="text-gray-400 mt-1">Manage your inventory and product catalog.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleImport}
            disabled={importing}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl font-medium transition-colors border border-gray-700 flex items-center gap-2"
          >
            {importing ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
            Import API
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2">
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-100 transition-all outline-none text-sm"
          />
        </div>
      </div>

      <Table 
        columns={columns} 
        data={products} 
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchProducts(page)}
      />
    </div>
  );
};

export default Products;
