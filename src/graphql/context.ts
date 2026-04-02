import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyPrivyTokenFast, UserContext } from '@/lib/auth-utils';

export interface GraphQLContext {
  prisma: PrismaClient;
  user: UserContext;
  getFullUser: () => Promise<UserContext>;
}

export async function createContext({ req }: { req: any }): Promise<GraphQLContext> {
  const authToken = req.cookies?.['privy-token'] || req.headers?.authorization?.replace('Bearer ', '');

  const user = authToken ? await verifyPrivyTokenFast(authToken) : { isAuthenticated: false };

  return {
    prisma,
    user,
    getFullUser: async () => {
      if (!authToken || !user.isAuthenticated) {
        return { isAuthenticated: false };
      }
      try {
        const { getUserFromPrivyToken } = await import('@/lib/auth-utils');
        return await getUserFromPrivyToken(authToken);
      } catch (error) {
        return { isAuthenticated: false };
      }
    }
  };
}
