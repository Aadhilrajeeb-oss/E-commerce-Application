import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShoppingBag, ArrowRight, Mail, Lock, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const CustomerLogin = () => {
  const { login, isLoading, error: authError } = useAuthStore();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    const success = await login(data.email, data.password);
    if (success) {
      navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-5xl bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl flex shadow-2xl shadow-black">
        {/* Left Side: Brand Visual */}
        <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-indigo-900/40 to-black p-12 flex-col justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-2xl shadow-xl">
              <ShoppingBag className="text-indigo-600 w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">TechMart</span>
          </div>

          <div>
            <h1 className="text-5xl font-bold leading-tight mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Elevate Your <br /> Tech Lifestyle.
            </h1>
            <p className="text-gray-400 text-lg max-w-md">
              Access exclusive early releases, manage your premium orders, and experience technology redefined.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Global Shipping</span>
            <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
            <span>24/7 Support</span>
            <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
            <span>Secured Payments</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 p-12 sm:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-500">Please enter your details to sign in.</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full bg-white/5 border ${
                    errors.email ? 'border-red-500/50' : 'border-white/10'
                  } text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all duration-300 placeholder:text-gray-600`}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="mt-2 text-xs text-red-400 ml-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className={`w-full bg-white/5 border ${
                    errors.password ? 'border-red-500/50' : 'border-white/10'
                  } text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all duration-300 placeholder:text-gray-600`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-2 text-xs text-red-400 ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all duration-300 disabled:opacity-70 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-500 text-sm">
            New to TechMart?{' '}
            <button
              onClick={() => setIsRegistering(true)}
              className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
