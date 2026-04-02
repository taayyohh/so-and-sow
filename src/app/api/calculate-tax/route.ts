import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-08-16' as Stripe.LatestApiVersion,
  });
}

function getShippingCents(totalQuantity: number) {
  return totalQuantity > 5 ? 1000 : 500;
}

export async function POST(req: NextRequest) {
  try {
    const { cartItems, shippingAddress } = await req.json();

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.zipCode || !shippingAddress?.country) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 });
    }

    const totalQuantity = cartItems.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
    const shippingCents = getShippingCents(totalQuantity);

    const subtotalCents = cartItems.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + Math.round(item.price * 100) * item.quantity,
      0
    );

    const stripe = getStripe();

    const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = cartItems.map(
      (item: { productId: string; price: number; quantity: number }) => ({
        amount: Math.round(item.price * 100) * item.quantity,
        reference: item.productId,
        tax_code: 'txcd_99999999',
      })
    );

    const calculation = await stripe.tax.calculations.create({
      currency: 'usd',
      customer_details: {
        address: {
          line1: shippingAddress.street || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country,
        },
        address_source: 'shipping',
      },
      line_items: lineItems,
      shipping_cost: { amount: shippingCents },
    });

    const taxAmountCents = calculation.tax_amount_exclusive;
    const totalCents = subtotalCents + shippingCents + taxAmountCents;

    return NextResponse.json({
      subtotal: subtotalCents / 100,
      shipping: shippingCents / 100,
      tax: taxAmountCents / 100,
      total: totalCents / 100,
      taxCalculationId: calculation.id,
    });
  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate tax' }, { status: 500 });
  }
}
