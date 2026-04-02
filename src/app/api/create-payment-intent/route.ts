import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrivyClient } from '@privy-io/server-auth';
import Stripe from 'stripe';

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-08-16' as Stripe.LatestApiVersion,
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const authToken = authHeader?.replace('Bearer ', '');
    let userId: string | null = null;

    if (authToken) {
      const privy = new PrivyClient(
        process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
        process.env.PRIVY_APP_SECRET!
      );
      try {
        const verifiedUser = await privy.verifyAuthToken(authToken);
        const userDetails = await privy.getUser(verifiedUser.userId);
        if (userDetails.email?.address) {
          let dbUser = await prisma.user.findUnique({
            where: { email: userDetails.email.address },
            select: { id: true }
          });
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: { email: userDetails.email.address, privyUserId: verifiedUser.userId },
              select: { id: true },
            });
          }
          userId = dbUser.id;
        }
      } catch {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { cartItems, shippingAddress, taxCalculationId } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const productIds = cartItems.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isArchived: false },
      include: { stock: true },
    });

    for (const cartItem of cartItems) {
      const product = products.find((p: any) => p.id === cartItem.productId);
      if (!product) return NextResponse.json({ error: 'Product unavailable' }, { status: 400 });
      if (cartItem.size) {
        const sizeStock = product.stock.find(s => s.size === cartItem.size);
        if (!sizeStock || cartItem.quantity > sizeStock.quantity) {
          return NextResponse.json({ error: `Insufficient stock for size ${cartItem.size}` }, { status: 400 });
        }
      } else if (cartItem.quantity > product.quantity) {
        return NextResponse.json({ error: 'Insufficient inventory' }, { status: 400 });
      }
    }

    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const product = products.find((p: any) => p.id === item.productId)!;
      return sum + (product.price * item.quantity);
    }, 0);

    const totalQuantity = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const SHIPPING_AMOUNT = totalQuantity > 5 ? 10.00 : 5.00;
    let taxAmount = 0;

    const stripe = getStripe();

    if (taxCalculationId) {
      const taxCalc = await stripe.tax.calculations.retrieve(taxCalculationId);
      taxAmount = taxCalc.tax_amount_exclusive / 100;
    }

    const total = subtotal + SHIPPING_AMOUNT + taxAmount;

    const orderItems = cartItems.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId)!;
      return `${item.productId}:${item.quantity}:${product.price}:${item.size || ''}`;
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      metadata: {
        userId,
        orderItems: orderItems.join('|'),
        shippingAddress: JSON.stringify(shippingAddress || {}),
        shippingAmount: String(SHIPPING_AMOUNT),
        taxAmount: String(taxAmount),
        total: String(total),
        ...(taxCalculationId ? { tax_calculation: taxCalculationId } : {}),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
