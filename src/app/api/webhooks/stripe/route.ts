import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-08-16' as Stripe.LatestApiVersion,
  });
}

export async function POST(req: NextRequest) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
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

  // Idempotency
  const existing = await prisma.webhookEvent.findUnique({ where: { stripeEventId: event.id } });
  if (existing) return NextResponse.json({ received: true });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      case 'payment_intent.payment_failed':
        // No action — orders only created on success
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event);
        break;
      case 'price.updated':
      case 'price.created':
        await handlePriceUpdate(event);
        break;
      case 'product.updated':
        await handleProductUpdate(event);
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

// === Payment Intent Succeeded ===
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const meta = paymentIntent.metadata;

  if (!meta?.userId || !meta?.orderItems) return;

  // Idempotency: check if order already exists
  const existingOrder = await prisma.order.findFirst({
    where: { stripeSessionId: paymentIntent.id },
  });
  if (existingOrder) return;

  // Parse order items (format: productId:quantity:price:size|...)
  const items = meta.orderItems.split('|').map((entry) => {
    const [productId, qty, price, size] = entry.split(':');
    return { productId, quantity: parseInt(qty), price: parseFloat(price), size: size || null };
  });

  const shippingAddress = meta.shippingAddress ? JSON.parse(meta.shippingAddress) : undefined;
  const shippingAmount = parseFloat(meta.shippingAmount || '0');
  const taxAmount = parseFloat(meta.taxAmount || '0');
  const total = parseFloat(meta.total || '0');

  await prisma.$transaction(async (tx) => {
    // Decrement inventory
    for (const item of items) {
      if (item.size) {
        await tx.productStock.updateMany({
          where: { productId: item.productId, size: item.size, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
      } else {
        await tx.product.updateMany({
          where: { id: item.productId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }

    // Fetch product names
    const productIds = items.map(i => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    // Create order
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
            name: products.find(p => p.id === item.productId)?.name || 'Unknown',
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          })),
        },
      },
    });
  });
}

// === Checkout Session Completed ===
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const { orderId } = session.metadata || {};
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status !== 'PENDING') return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    for (const item of order.items) {
      if (item.productId) {
        await tx.product.updateMany({
          where: { id: item.productId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }
  });
}

// === Checkout Session Expired ===
async function handleCheckoutSessionExpired(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const { orderId } = session.metadata || {};
  if (!orderId) return;

  await prisma.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'CANCELED' },
  });
}

// === Price Updated/Created — sync to DB ===
async function handlePriceUpdate(event: Stripe.Event) {
  const price = event.data.object as Stripe.Price;
  const stripeProductId = typeof price.product === 'string' ? price.product : (price.product as any)?.id;
  if (!stripeProductId || !price.active) return;

  const newPrice = (price.unit_amount || 0) / 100;

  await prisma.product.updateMany({
    where: { stripeProductId },
    data: { price: newPrice, stripePriceId: price.id },
  });
}

// === Product Updated — sync name/description/active to DB ===
async function handleProductUpdate(event: Stripe.Event) {
  const stripeProduct = event.data.object as Stripe.Product;

  await prisma.product.updateMany({
    where: { stripeProductId: stripeProduct.id },
    data: {
      name: stripeProduct.name,
      description: stripeProduct.description || undefined,
      isActive: stripeProduct.active,
    },
  });
}
