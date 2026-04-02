'use client';

import { useState } from 'react';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { usePrivy } from '@privy-io/react-auth';

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffffff',
      '::placeholder': {
        color: 'rgba(255,255,255,0.4)',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

export function PaymentForm({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = usePrivy();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      onError('Card information is incomplete');
      setIsProcessing(false);
      return;
    }
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: { email: user?.email?.address },
        },
      });
      if (error) {
        onError(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent?.status === 'succeeded') {
        setIsComplete(true);
        onSuccess(paymentIntent.id);
      }
    } catch {
      onError('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <p className="text-xs tracking-widest uppercase text-white/50">Payment Information</p>
        <div className="border-t border-white/10" />
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1 text-white/70">Card Number</label>
            <div className="p-3 border border-white/20 bg-[#1b1b1b]">
              <CardNumberElement options={cardElementOptions} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-white/70">Expiry Date</label>
              <div className="p-3 border border-white/20 bg-[#1b1b1b]">
                <CardExpiryElement options={cardElementOptions} />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/70">CVC</label>
              <div className="p-3 border border-white/20 bg-[#1b1b1b]">
                <CardCvcElement options={cardElementOptions} />
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!stripe || isProcessing || isComplete}
          className="w-full py-3 bg-white text-[#131313] text-sm tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isComplete ? 'Order placed! Redirecting...' : isProcessing ? 'Processing...' : 'Complete Purchase'}
        </button>
      </div>
    </form>
  );
}
