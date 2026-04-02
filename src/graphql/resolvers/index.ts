import { productResolvers } from './product';
import { orderResolvers } from './order';
import { userResolvers } from './user';
import { adminResolvers } from './admin';
import { epkResolvers } from './epk';
import { GraphQLScalarType, Kind } from 'graphql';

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON scalar type',
  serialize(value) { return value; },
  parseValue(value) { return value; },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return JSON.parse(ast.value);
    return null;
  },
});

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime scalar',
  serialize(value) {
    if (value instanceof Date) return value.toISOString();
    return value;
  },
  parseValue(value) { return new Date(value as string); },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

export const resolvers = {
  JSON: JSONScalar,
  DateTime: DateTimeScalar,
  Query: {
    ...productResolvers.Query,
    ...orderResolvers.Query,
    ...userResolvers.Query,
    ...adminResolvers.Query,
    ...epkResolvers.Query,
  },
  Mutation: {
    ...productResolvers.Mutation,
    ...userResolvers.Mutation,
    ...adminResolvers.Mutation,
  },
  Product: productResolvers.Product,
};
