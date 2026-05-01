import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { useCartStore } from '../store/cartStore';
import { ShoppingCart, Plus, Check, Info } from 'lucide-react';

const CustomerStore = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, items: cartItems } = useCartStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/products');
        setProducts(res.data.data.products);
      } catch (err) {
        console.error('Error fetching products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const isInCart = (productId) => cartItems.some(item => item.id === productId);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tighter text-white mb-4">Curated Excellence</h1>
        <p className="text-gray-500 text-lg">Discover the future of personal technology. Expertly selected for those who demand the best.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <div 
            key={product.id}
            className="group bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-2"
          >
            <div className="aspect-square bg-white/[0.03] relative overflow-hidden">
              <img 
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60'} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-60"></div>
              
              <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                <button 
                  onClick={() => addItem(product)}
                  className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all ${
                    isInCart(product.id) 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-white text-black hover:bg-gray-200 shadow-xl'
                  }`}
                >
                  {isInCart(product.id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>In Cart</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Experience</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{product.name}</h3>
                <span className="text-indigo-400 font-bold">${parseFloat(product.price).toLocaleString()}</span>
              </div>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                {product.description || 'Precision-engineered for the modern innovator. Experience unparalleled performance.'}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-600 font-semibold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span>In Stock: {product.stock_quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerStore;
