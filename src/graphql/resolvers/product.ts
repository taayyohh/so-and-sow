import { GraphQLContext } from '../context';
import Stripe from 'stripe';
import slugify from 'slugify';

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-08-16' as Stripe.LatestApiVersion,
  });
}

async function requireAdmin(context: GraphQLContext) {
  const user = await context.getFullUser();
  if (!user?.isAuthenticated || user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}

function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

export const productResolvers = {
  Product: {
    stock: async (parent: any, _args: any, { prisma }: GraphQLContext) => {
      return prisma.productStock.findMany({
        where: { productId: parent.id },
      });
    },
  },

  Query: {
    products: async (_parent: unknown, args: any, { prisma }: GraphQLContext) => {
      const { category, status, search } = args;
      const where: any = {
        ...(status !== 'all' ? { isArchived: false } : {}),
        ...(category ? { category } : {}),
        ...(status && status !== 'all' ? { isActive: status === 'active' } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      };
      return prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    },

    product: async (_parent: unknown, { id }: { id: string }, { prisma }: GraphQLContext) => {
      return prisma.product.findUnique({ where: { id } });
    },

    productBySlug: async (_parent: unknown, { slug }: { slug: string }, { prisma }: GraphQLContext) => {
      const product = await prisma.product.findUnique({ where: { slug } });
      if (product && product.isArchived) return null;
      return product;
    },

    featuredProduct: async (_parent: unknown, _args: unknown, { prisma }: GraphQLContext) => {
      return prisma.product.findFirst({
        where: { isFeatured: true, isActive: true, isArchived: false },
      });
    },
  },

  Mutation: {
    createProduct: async (_parent: unknown, { input }: { input: any }, context: GraphQLContext) => {
      await requireAdmin(context);
      const { prisma } = context;

      if (!input.name?.trim()) throw new Error('Product name is required');
      if (input.price <= 0) throw new Error('Price must be greater than zero');

      const stripe = getStripe();
      let stripeProductId = '';
      let stripePriceId = '';

      try {
        const stripeProduct = await stripe.products.create({
          name: input.name,
          description: input.description || '',
          active: true,
        });
        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: Math.round(input.price * 100),
          currency: 'usd',
        });
        stripeProductId = stripeProduct.id;
        stripePriceId = stripePrice.id;
      } catch {
        stripeProductId = `mock_prod_${Date.now()}`;
        stripePriceId = `mock_price_${Date.now()}`;
      }

      const slug = generateSlug(input.name);
      const sizes = input.sizes || [];

      return prisma.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description || '',
          price: input.price,
          category: input.category || '',
          images: input.images || [],
          quantity: input.quantity || 0,
          isActive: true,
          stripeProductId,
          stripePriceId,
          ...(sizes.length > 0 ? {
            stock: {
              create: sizes.map((s: any) => ({ size: s.size, quantity: s.quantity })),
            },
          } : {}),
        },
        include: { stock: true },
      });
    },

    updateProduct: async (_parent: unknown, { id, input }: { id: string; input: any }, context: GraphQLContext) => {
      await requireAdmin(context);
      const { prisma } = context;

      const currentProduct = await prisma.product.findUnique({ where: { id } });
      if (!currentProduct) throw new Error('Product not found');

      const stripe = getStripe();

      try {
        if (currentProduct.stripeProductId && !currentProduct.stripeProductId.startsWith('mock_')) {
          await stripe.products.update(currentProduct.stripeProductId, {
            name: input.name || currentProduct.name,
            description: input.description || currentProduct.description,
            active: input.isActive !== undefined ? input.isActive : currentProduct.isActive,
          });

          if (input.price !== undefined && input.price !== currentProduct.price) {
            const newPrice = await stripe.prices.create({
              product: currentProduct.stripeProductId,
              unit_amount: Math.round(input.price * 100),
              currency: 'usd',
            });
            if (currentProduct.stripePriceId) {
              try { await stripe.prices.update(currentProduct.stripePriceId, { active: false }); } catch {}
            }
            input.stripePriceId = newPrice.id;
          }
        }
      } catch {}

      const data: any = { ...input };
      delete data.sizes;

      if (input.name && input.name !== currentProduct.name) {
        data.slug = generateSlug(input.name);
      }

      if (input.sizes) {
        await prisma.productStock.deleteMany({ where: { productId: id } });
        await prisma.productStock.createMany({
          data: input.sizes.map((s: any) => ({ productId: id, size: s.size, quantity: s.quantity })),
        });
      }

      return prisma.product.update({ where: { id }, data, include: { stock: true } });
    },

    toggleProductStatus: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      await requireAdmin(context);
      const { prisma } = context;
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) throw new Error('Product not found');

      const stripe = getStripe();
      try {
        if (product.stripeProductId && !product.stripeProductId.startsWith('mock_')) {
          await stripe.products.update(product.stripeProductId, { active: !product.isActive });
        }
      } catch {}

      return prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
    },
  },
};
