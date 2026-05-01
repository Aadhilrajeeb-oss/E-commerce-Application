import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from '../api/axiosInstance';
import { Shield, Lock, CreditCard, Loader2, CheckCircle } from 'lucide-react';

const stripePromise = loadStripe('pk_test_51...your_publishable_key'); // Replace with actual PK

const CheckoutForm = ({ orderId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createIntent = async () => {
      try {
        const res = await axios.post('/payments/create-intent', { order_id: orderId });
        setClientSecret(res.data.data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent', err);
        setError('Failed to initialize payment. Please try again.');
      }
    };
    createIntent();
  }, [orderId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      }
    });

    if (payload.error) {
      setError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      onSuccess(payload.paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <CreditCard className="text-indigo-400 w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Payment Details</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
            <Lock className="w-3 h-3" />
            <span>Encrypted</span>
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl mb-8">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#fff',
                  '::placeholder': { color: '#4b5563' },
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
                invalid: { color: '#ef4444' },
              },
            }} 
          />
        </div>

        <button
          disabled={!stripe || processing || !clientSecret}
          className="w-full bg-white text-black hover:bg-gray-200 font-bold py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all duration-300 disabled:opacity-50"
        >
          {processing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span>Pay ${amount.toLocaleString()}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center space-x-6 text-gray-500 opacity-50">
        <Shield className="w-5 h-5" />
        <span className="text-xs uppercase tracking-widest font-semibold">Stripe Secure Checkout</span>
      </div>
    </form>
  );
};

const Checkout = () => {
  const [success, setSuccess] = useState(false);
  // Mock data for demo if not passed via state
  const orderData = { id: 'ORD-12345', amount: 1299.99 };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
          <CheckCircle className="text-green-500 w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Payment Successful</h1>
        <p className="text-gray-400 text-lg mb-10">
          Your acquisition is being prepared. You will receive an email confirmation shortly.
        </p>
        <button 
          onClick={() => window.location.href = '/customer/dashboard'}
          className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
        >
          View Order Status
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold text-white mb-2">Finalize Purchase</h1>
          <p className="text-gray-500 mb-10">Complete your transaction to secure your items.</p>
          
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              orderId={orderData.id} 
              amount={orderData.amount} 
              onSuccess={() => setSuccess(true)} 
            />
          </Elements>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 sticky top-32">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-white">
                <span className="text-gray-400">Order Reference</span>
                <span className="font-mono text-sm">{orderData.id}</span>
              </div>
              <div className="flex justify-between items-center text-white">
                <span className="text-gray-400">Items (1)</span>
                <span>$1,200.00</span>
              </div>
              <div className="flex justify-between items-center text-white">
                <span className="text-gray-400">Shipping</span>
                <span className="text-green-400 font-semibold uppercase text-xs tracking-tighter">Complimentary</span>
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 flex justify-between items-end">
              <span className="text-gray-500 text-sm mb-1">Total Due</span>
              <span className="text-3xl font-bold text-white">${orderData.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
