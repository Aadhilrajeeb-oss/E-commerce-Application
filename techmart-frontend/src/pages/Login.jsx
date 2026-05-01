import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import { Lock, Mail, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/auth/login', data);
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">TechMart Admin</h1>
          <p className="text-gray-400">Sign in to manage your store</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <Mail size={18} />
              </div>
              <input 
                {...register('email')}
                className="w-full pl-11 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-100 transition-all outline-none"
                placeholder="admin@techmart.com"
              />
            </div>
            {errors.email && <p className="mt-2 text-sm text-rose-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input 
                type="password"
                {...register('password')}
                className="w-full pl-11 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-100 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="mt-2 text-sm text-rose-400">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
