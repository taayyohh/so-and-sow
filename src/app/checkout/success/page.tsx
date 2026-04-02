import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-medium mb-4 text-white">Order Confirmed</h1>
      <p className="text-white/60 mb-8">Thank you for your purchase.</p>
      <Link href="/orders" className="inline-block py-3 px-8 bg-white text-[#131313] text-sm tracking-widest uppercase hover:bg-white/90 transition-colors">
        View Orders
      </Link>
    </div>
  );
}
