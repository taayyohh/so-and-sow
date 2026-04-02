import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-medium mb-4 text-white">Checkout Canceled</h1>
      <p className="text-white/60 mb-8">Your order was not completed.</p>
      <Link href="/cart" className="inline-block py-3 px-8 border border-white text-white text-sm tracking-widest uppercase hover:bg-white hover:text-[#131313] transition-colors">
        Return to Cart
      </Link>
    </div>
  );
}
