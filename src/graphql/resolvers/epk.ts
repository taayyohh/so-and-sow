import { GraphQLContext } from '../context';

export const epkResolvers = {
  Query: {
    epkBySlug: async (_parent: any, { slug }: { slug: string }, { prisma }: GraphQLContext) => {
      return prisma.ePK.findUnique({
        where: { slug },
        include: {
          pressLinks: { orderBy: { sortOrder: 'asc' } },
          photos: { orderBy: { sortOrder: 'asc' } },
          tourGraphics: { orderBy: { sortOrder: 'asc' } },
        },
      });
    },
  },
};
