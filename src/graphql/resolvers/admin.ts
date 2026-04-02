import { GraphQLContext } from '../context';

async function requireAdmin(context: GraphQLContext) {
  const user = await context.getFullUser();
  if (!user?.isAuthenticated || user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}

export const adminResolvers = {
  Query: {
    adminMetrics: async (_parent: any, _args: any, context: GraphQLContext) => {
      await requireAdmin(context);
      const { prisma } = context;
      const totalOrders = await prisma.order.count();
      const revenueResult = await prisma.order.aggregate({
        where: { status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        _sum: { total: true },
      });
      const totalRevenue = revenueResult._sum.total || 0;
      const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
      const totalProducts = await prisma.product.count({ where: { isArchived: false } });
      return { totalOrders, totalRevenue, pendingOrders, totalProducts };
    },

    adminOrders: async (_parent: any, args: any, context: GraphQLContext) => {
      await requireAdmin(context);
      const { prisma } = context;
      const limit = Math.min(Math.max(args.limit || 50, 1), 100);
      const offset = Math.max(args.offset || 0, 0);
      const where: any = {};
      if (args.status) where.status = args.status;

      const orders = await prisma.order.findMany({
        skip: offset, take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { product: { select: { name: true, images: true } } } }
        }
      });

      return orders.map((order: any) => ({
        id: order.id,
        customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email,
        customerEmail: order.user.email,
        total: order.total,
        status: order.status,
        date: order.createdAt.toISOString(),
        shippingAddress: order.shippingAddress,
        items: order.items.map((item: any) => ({
          id: item.id,
          productName: item.name || item.product?.name || 'Deleted product',
          quantity: item.quantity,
          price: item.price,
          size: item.size,
        }))
      }));
    },

    adminOrder: async (_parent: any, args: { orderId: string }, context: GraphQLContext) => {
      await requireAdmin(context);
      const { prisma } = context;
      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, images: true, price: true, quantity: true, isActive: true, createdAt: true, updatedAt: true },
              },
            },
          },
        }
      });
      if (!order) return null;
      return {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item: any) => ({
          ...item,
          name: item.name || item.product?.name || 'Product',
        })),
      };
    },
  },

  Mutation: {
    setUserRole: async (_parent: any, args: { email: string; role: string }, context: GraphQLContext) => {
      await requireAdmin(context);
      const validRoles = ['ADMIN', 'PUBLIC'];
      if (!validRoles.includes(args.role)) throw new Error(`Invalid role: ${args.role}`);
      const updatedUser = await context.prisma.user.update({
        where: { email: args.email },
        data: { role: args.role as any },
      });
      return { ...updatedUser, createdAt: updatedUser.createdAt.toISOString(), updatedAt: updatedUser.updatedAt.toISOString() };
    },

    updateOrderStatus: async (_parent: any, args: { orderId: string; status: string }, context: GraphQLContext) => {
      await requireAdmin(context);
      const { prisma } = context;
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];
      if (!validStatuses.includes(args.status)) throw new Error('Invalid order status');

      const currentOrder = await prisma.order.findUnique({ where: { id: args.orderId }, include: { items: true } });
      if (!currentOrder) throw new Error('Order not found');

      const wasProcessed = ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(currentOrder.status);
      const isCanceling = args.status === 'CANCELED';

      const updatedOrder = await prisma.$transaction(async (tx: any) => {
        if (wasProcessed && isCanceling) {
          for (const item of currentOrder.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: { quantity: { increment: item.quantity } },
              });
              if (item.size) {
                await tx.productStock.updateMany({
                  where: { productId: item.productId, size: item.size },
                  data: { quantity: { increment: item.quantity } },
                });
              }
            }
          }
        }
        return tx.order.update({
          where: { id: args.orderId },
          data: { status: args.status as any },
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
      });

      return {
        id: updatedOrder.id,
        customerName: `${updatedOrder.user.firstName || ''} ${updatedOrder.user.lastName || ''}`.trim() || updatedOrder.user.email,
        customerEmail: updatedOrder.user.email,
        total: updatedOrder.total,
        status: updatedOrder.status,
        date: updatedOrder.createdAt.toISOString(),
      };
    },
  },
};
