import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-08-16' as Stripe.LatestApiVersion,
  });
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  if (!endpointSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature!, endpointSecret);
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const existing = await prisma.webhookEvent.findUnique({ where: { stripeEventId: event.id } });
  if (existing) return NextResponse.json({ received: true });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      case 'payment_intent.payment_failed':
        break;
    }

    await prisma.webhookEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Webhook handler error [${event.type}]:`, error);
    return NextResponse.json({ received: true, error: 'Handler failed' });
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const meta = paymentIntent.metadata;

  if (!meta?.userId || !meta?.orderItems) return;

  const existingOrder = await prisma.order.findFirst({
    where: { stripeSessionId: paymentIntent.id },
  });
  if (existingOrder) return;

  const items = meta.orderItems.split('|').map((entry) => {
    const [productId, qty, price, size] = entry.split(':');
    return { productId, quantity: parseInt(qty), price: parseFloat(price), size: size || null };
  });

  const shippingAddress = meta.shippingAddress ? JSON.parse(meta.shippingAddress) : undefined;
  const shippingAmount = parseFloat(meta.shippingAmount || '0');
  const taxAmount = parseFloat(meta.taxAmount || '0');
  const total = parseFloat(meta.total || '0');

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (item.size) {
        await tx.productStock.updateMany({
          where: { productId: item.productId, size: item.size, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (product && product.quantity >= item.quantity) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }

    await tx.order.create({
      data: {
        userId: meta.userId,
        total,
        shippingAmount,
        taxAmount,
        status: 'PROCESSING',
        shippingAddress,
        stripeSessionId: paymentIntent.id,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: '',
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          })),
        },
      },
    });
  });
}
