import { GraphQLContext } from '../context';

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

      return orders.map((order: any) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item: any) => ({
          ...item,
          name: item.name || item.product?.name || 'Product',
        })),
      }));
    },
  },
};
