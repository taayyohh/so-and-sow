'use client'

import { toast } from 'sonner'
import { useCart } from '@/hooks/useCart'
import { ipfsUrl } from '@/lib/ipfs'

interface PreorderButtonProps {
  product: {
    id: string
    name: string
    price: number
    images: string[]
    quantity: number
    stock: { size: string; quantity: number }[]
  }
}

export default function PreorderButton({ product }: PreorderButtonProps) {
  const { addToCart } = useCart()

  const isSoldOut = product.stock.length > 0
    ? product.stock.every(s => s.quantity === 0)
    : product.quantity === 0

  const handlePreorder = () => {
    if (isSoldOut) return

    addToCart({
      productId: product.id,
      quantity: 1,
      price: product.price,
      size: null,
      productName: product.name,
      productImage: product.images[0] ? ipfsUrl(product.images[0]) : '',
    })

    toast.success('Added to cart')
  }

  return (
    <button
      onClick={handlePreorder}
      disabled={isSoldOut}
      className="w-full py-4 bg-white text-[#131313] text-sm tracking-widest uppercase font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSoldOut ? 'Sold Out' : 'Pre-Order Vinyl'}
    </button>
  )
}
