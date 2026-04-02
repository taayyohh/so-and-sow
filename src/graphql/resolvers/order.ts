import { GraphQLContext } from '../context';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-08-16' as Stripe.LatestApiVersion,
  });
}

async function getCurrentUserId(context: any): Promise<string | null> {
  try {
    if (!context.user?.isAuthenticated) return null;
    if (!context.user.id && context.getFullUser) {
      const fullUser = await context.getFullUser();
      return fullUser.isAuthenticated ? fullUser.id || null : null;
    }
    return context.user.id || null;
  } catch (error) {
    return null;
  }
}

export const orderResolvers = {
  Query: {
    userOrders: async (_parent: any, _args: any, context: GraphQLContext) => {
      const userId = await getCurrentUserId(context);
      if (!userId) throw new Error('Authentication required');

      const orders = await context.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, images: true, price: true },
              },
            },
          },
        },
      });

      // Fetch receipt URLs from Stripe
      const stripe = process.env.STRIPE_SECRET_KEY ? getStripe() : null;
      const enriched = await Promise.all(orders.map(async (order: any) => {
        let receiptUrl: string | null = null;
        if (stripe && order.stripeSessionId) {
          try {
            const charges = await stripe.charges.list({ payment_intent: order.stripeSessionId, limit: 1 });
            receiptUrl = charges.data[0]?.receipt_url || null;
          } catch { /* ignore */ }
        }
        return {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          receiptUrl,
          items: order.items.map((item: any) => ({
            ...item,
            name: item.name || item.product?.name || 'Product',
          })),
        };
      }));
      return enriched;
    },
  },
};
