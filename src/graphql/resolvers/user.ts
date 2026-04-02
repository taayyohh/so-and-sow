import { GraphQLContext } from '../context';

async function getCurrentUserId(context: any): Promise<string | null> {
  try {
    if (!context.user?.isAuthenticated) return null;
    if (!context.user.id && context.getFullUser) {
      const fullUser = await context.getFullUser();
      return fullUser.isAuthenticated ? fullUser.id || null : null;
    }
    return context.user.id || null;
  } catch {
    return null;
  }
}

export const userResolvers = {
  Query: {
    currentUser: async (_parent: any, _args: any, context: GraphQLContext) => {
      const userId = await getCurrentUserId(context);
      if (!userId) return null;
      const user = await context.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, updatedAt: true },
      });
      if (!user) return null;
      return { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() };
    },
  },
  Mutation: {
    updateUser: async (_parent: any, args: any, context: GraphQLContext) => {
      const userId = await getCurrentUserId(context);
      if (!userId) throw new Error('Authentication required');
      const { firstName, lastName, email } = args.input;
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      const updatedUser = await context.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, updatedAt: true },
      });
      return { ...updatedUser, createdAt: updatedUser.createdAt.toISOString(), updatedAt: updatedUser.updatedAt.toISOString() };
    },
  },
};
