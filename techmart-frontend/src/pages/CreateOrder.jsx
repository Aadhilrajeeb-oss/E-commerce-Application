import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Search, ShoppingCart, Loader2, ArrowRight, Trash2 } from 'lucide-react';

const CreateOrder = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // State
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchCust, setSearchCust] = useState('');
  const [searchProd, setSearchProd] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]); // { product, quantity }

  useEffect(() => {
    if (searchCust.length > 2) {
      api.get(`/customers?search=${searchCust}`).then(res => setCustomers(res.data.data));
    }
  }, [searchCust]);

  useEffect(() => {
    if (searchProd.length > 2) {
      api.get(`/products?search=${searchProd}&status=active`).then(res => setProducts(res.data.data.products));
    }
  }, [searchProd]);

  const addToCart = (product) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) return alert('Cannot exceed stock');
      setCart(cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const submitOrder = async () => {
    try {
      setLoading(true);
      const payload = {
        customer_id: selectedCustomer.id,
        items: cart.map(c => ({ product_id: c.product.id, quantity: c.quantity }))
      };
      await api.post('/orders', payload);
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Create Manual Order</h2>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={step >= 1 ? 'text-indigo-400' : 'text-gray-500'}>1. Customer</span>
          <ArrowRight size={14} className="text-gray-600" />
          <span className={step >= 2 ? 'text-indigo-400' : 'text-gray-500'}>2. Products</span>
          <ArrowRight size={14} className="text-gray-600" />
          <span className={step >= 3 ? 'text-indigo-400' : 'text-gray-500'}>3. Review</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-200">Select Customer</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search customers by name or email..." 
                value={searchCust}
                onChange={(e) => setSearchCust(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 text-gray-100"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedCustomer?.id === c.id 
                      ? 'bg-indigo-600/10 border-indigo-500' 
                      : 'bg-gray-950 border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <p className="font-medium text-gray-200">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.email}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-800">
              <button 
                onClick={() => setStep(2)}
                disabled={!selectedCustomer}
                className="px-6 py-2 bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-medium"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-200">Add Products</h3>
              <span className="text-sm text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">{cart.length} items in cart</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchProd}
                onChange={(e) => setSearchProd(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 text-gray-100"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="p-4 bg-gray-950 border border-gray-800 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-200">{p.name}</p>
                    <p className="text-sm text-gray-500">${p.price} • {p.stock_quantity} in stock</p>
                  </div>
                  <button 
                    onClick={() => addToCart(p)}
                    disabled={p.stock_quantity === 0}
                    className="p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-800">
              <button onClick={() => setStep(1)} className="px-6 py-2 text-gray-400 hover:text-gray-200">Back</button>
              <button 
                onClick={() => setStep(3)}
                disabled={cart.length === 0}
                className="px-6 py-2 bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-medium"
              >
                Review Order
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-200">Review & Submit</h3>
            
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <h4 className="text-sm text-gray-500 mb-2">Customer Info</h4>
              <p className="font-medium text-gray-200">{selectedCustomer.name}</p>
              <p className="text-gray-400 text-sm">{selectedCustomer.email}</p>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <h4 className="text-sm text-gray-500 mb-4">Order Items</h4>
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-200">{item.product.name}</p>
                      <p className="text-xs text-gray-500">${item.product.price} × {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-100">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                <span className="font-bold text-gray-300">Total</span>
                <span className="text-xl font-bold text-indigo-400">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-800">
              <button onClick={() => setStep(2)} className="px-6 py-2 text-gray-400 hover:text-gray-200">Back</button>
              <button 
                onClick={submitOrder}
                disabled={loading}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                Confirm Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrder;
