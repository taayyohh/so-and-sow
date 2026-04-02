'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useCart } from '@/hooks/useCart';
import { StripeProvider } from '@/components/providers/StripeProvider';
import { PaymentForm } from '@/components/checkout/PaymentForm';

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taxInfo, setTaxInfo] = useState<{
    subtotal: number; shipping: number; tax: number; total: number; taxCalculationId: string;
  } | null>(null);
  const [isCalculatingTax, setIsCalculatingTax] = useState(false);
  const paymentSucceeded = useRef(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', street: '', city: '', state: '', zipCode: '', country: 'US',
  });
  const router = useRouter();
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { cart, clearCart } = useCart();

  useEffect(() => {
    setIsReady(true);
    if (user?.email?.address) {
      setFormData(prev => ({ ...prev, email: user.email?.address || '' }));
    }
  }, [user]);

  useEffect(() => {
    if (ready && !authenticated) router.push('/cart');
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (ready && cart && cart.items.length === 0 && !paymentSucceeded.current) router.push('/cart');
  }, [ready, cart, router]);

  const isAddressComplete = !!(formData.city && formData.state && formData.zipCode && formData.country);

  const calculateTax = useCallback(async () => {
    if (!cart || cart.items.length === 0) return;
    setIsCalculatingTax(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('/api/calculate-tax', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cartItems: cart.items.map(item => ({
            productId: item.productId, quantity: item.quantity, price: item.price,
          })),
          shippingAddress: {
            street: formData.street, city: formData.city, state: formData.state, zipCode: formData.zipCode, country: formData.country,
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate tax');
      }
      const data = await response.json();
      setTaxInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate tax');
    } finally {
      setIsCalculatingTax(false);
    }
  }, [cart, formData.street, formData.city, formData.state, formData.zipCode, formData.country, getAccessToken]);

  useEffect(() => {
    if (!isAddressComplete || !cart || cart.items.length === 0) return;
    setTaxInfo(null);
    const timer = setTimeout(() => { calculateTax(); }, 500);
    return () => clearTimeout(timer);
  }, [isAddressComplete, calculateTax]);

  if (!isReady) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
        <div className="h-6 bg-[#1b1b1b] w-32 mx-auto mb-8" />
        <div className="space-y-4">
          <div className="h-10 bg-[#1b1b1b]" />
          <div className="h-10 bg-[#1b1b1b]" />
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function createPaymentIntent() {
    if (!taxInfo) { setError('Please complete your shipping address'); return; }
    setIsLoading(true);
    setError(null);
    try {
      if (!cart || cart.items.length === 0) throw new Error('Cart is empty');
      const token = await getAccessToken();
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          cartItems: cart.items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price, size: item.size })),
          shippingAddress: { street: formData.street, city: formData.city, state: formData.state, zipCode: formData.zipCode, country: formData.country },
          taxCalculationId: taxInfo.taxCalculationId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  }

  const handlePaymentSuccess = async () => {
    paymentSucceeded.current = true;
    clearCart();
    await new Promise(resolve => setTimeout(resolve, 2500));
    router.push('/orders');
  };

  const handlePaymentError = (errorMessage: string) => setError(errorMessage);

  const inputClass = 'w-full p-3 border border-white/20 bg-[#1b1b1b] text-white text-sm focus:outline-none focus:border-white transition-colors';

  const isInternational = formData.country !== 'US';
  const fallbackShipping = isInternational ? 25.00 : 5.00;

  return (
    <StripeProvider>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-sm tracking-[0.3em] uppercase font-medium text-center mb-10 text-white">Checkout</h1>
        {error && (
          <div className="p-4 bg-red-900/30 border border-red-500/30 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-6 order-1">
            <div className="border border-white/10 p-6 space-y-4">
              <p className="text-xs tracking-widest uppercase text-white/50">Shipping Information</p>
              <div className="border-t border-white/10" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm mb-1 text-white/70">First Name</label>
                  <input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm mb-1 text-white/70">Last Name</label>
                  <input id="lastName" type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm mb-1 text-white/70">Email</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="street" className="block text-sm mb-1 text-white/70">Street Address</label>
                <input id="street" type="text" name="street" value={formData.street} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="block text-sm mb-1 text-white/70">City</label>
                  <input id="city" type="text" name="city" value={formData.city} onChange={handleInputChange} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm mb-1 text-white/70">State</label>
                  <input id="state" type="text" name="state" value={formData.state} onChange={handleInputChange} required className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="zipCode" className="block text-sm mb-1 text-white/70">ZIP Code</label>
                  <input id="zipCode" type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm mb-1 text-white/70">Country</label>
                  <select id="country" name="country" value={formData.country} onChange={handleInputChange} required className={inputClass}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="order-2 md:row-span-2 border border-white/10 p-6 h-fit">
            <p className="text-xs tracking-widest uppercase text-white/50 mb-4">Order Summary</p>
            <div className="border-t border-white/10 mb-4" />
            {cart && cart.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{item.product.name}</span>
                  <span className="text-xs text-white/50">&times;{item.quantity}</span>
                </div>
                <span className="text-sm text-white">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-white/10 my-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white">
                <span>Subtotal</span>
                <span>{formatPrice(cart?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-white">
                <span>Shipping</span>
                <span>{taxInfo ? formatPrice(taxInfo.shipping) : formatPrice(fallbackShipping)}</span>
              </div>
              <div className="flex justify-between text-sm text-white">
                <span>Tax</span>
                {isCalculatingTax ? (
                  <span className="text-white/50 animate-pulse">Calculating...</span>
                ) : taxInfo ? (
                  <span>{formatPrice(taxInfo.tax)}</span>
                ) : (
                  <span className="text-white/50">Enter address</span>
                )}
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="text-sm font-medium text-white">Total</span>
                <span className="text-sm font-medium text-white">
                  {taxInfo ? formatPrice(taxInfo.total) : formatPrice((cart?.total || 0) + fallbackShipping)}
                </span>
              </div>
            </div>
          </div>

          <div className="order-3 md:col-span-2 space-y-6">
            <div className="border border-white/10 p-6">
              {!clientSecret ? (
                <button
                  onClick={createPaymentIntent}
                  disabled={isLoading || !taxInfo}
                  className="w-full py-3 bg-white text-[#131313] text-sm tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Preparing Payment...' : !taxInfo ? 'Enter Shipping Address' : 'Continue to Payment'}
                </button>
              ) : (
                <PaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
            </div>
            <button onClick={() => router.push('/cart')} className="text-sm text-white/60 hover:text-white transition-colors">
              &larr; Return to Cart
            </button>
          </div>
        </div>
      </div>
    </StripeProvider>
  );
}
