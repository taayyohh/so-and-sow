import { graphql } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from '@/graphql/resolvers';
import { createContext } from '@/graphql/context';
import { NextRequest } from 'next/server';

const unifiedSchema = `
scalar DateTime
scalar JSON

type ProductStock {
  id: ID!
  size: String!
  quantity: Int!
}

type Product {
  id: ID!
  name: String!
  slug: String!
  description: String!
  images: [String!]!
  price: Float!
  category: String!
  quantity: Int!
  isActive: Boolean!
  isArchived: Boolean!
  isFeatured: Boolean!
  stripeProductId: String
  stripePriceId: String
  stock: [ProductStock!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input CreateProductInput {
  name: String!
  description: String!
  price: Float!
  category: String!
  images: [String!]
  quantity: Int
  sizes: [SizeInput!]
}

input SizeInput {
  size: String!
  quantity: Int!
}

input UpdateProductInput {
  name: String
  description: String
  price: Float
  category: String
  images: [String!]
  quantity: Int
  isActive: Boolean
  isArchived: Boolean
  sizes: [SizeInput!]
}

type User {
  id: ID!
  email: String!
  firstName: String
  lastName: String
  role: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

input UpdateUserInput {
  firstName: String
  lastName: String
  email: String
}

type OrderItem {
  id: ID!
  productId: ID
  name: String!
  quantity: Int!
  price: Float!
  size: String
  product: Product
}

type Address {
  street: String
  city: String
  state: String
  zipCode: String
  country: String
}

type Order {
  id: ID!
  userId: ID!
  total: Float!
  status: String!
  shippingAmount: Float!
  taxAmount: Float!
  shippingAddress: JSON
  stripeSessionId: String
  trackingNumber: String
  user: User
  items: [OrderItem!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AdminMetrics {
  totalOrders: Int!
  totalRevenue: Float!
  pendingOrders: Int!
  totalProducts: Int!
}

type AdminOrder {
  id: ID!
  customerName: String!
  customerEmail: String!
  total: Float!
  status: String!
  date: String!
  itemCount: Int
  shippingAddress: JSON
  items: [AdminOrderItem!]
}

type AdminOrderItem {
  id: ID!
  productName: String!
  quantity: Int!
  price: Float!
  size: String
}

type EPKPressLink {
  id: ID!
  outlet: String!
  url: String!
  description: String
  sortOrder: Int!
}

type EPKPhoto {
  id: ID!
  src: String!
  alt: String!
  sortOrder: Int!
}

type EPKTourGraphic {
  id: ID!
  src: String!
  title: String!
  sortOrder: Int!
}

type EPK {
  id: ID!
  title: String!
  slug: String!
  type: String!
  bio: String!
  heroVideoSrc: String
  heroVideoPoster: String
  isPublished: Boolean!
  liveVideos: JSON
  pressLinks: [EPKPressLink!]!
  photos: [EPKPhoto!]!
  tourGraphics: [EPKTourGraphic!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  products(category: String, status: String, search: String): [Product!]!
  product(id: ID!): Product
  productBySlug(slug: String!): Product
  featuredProduct: Product
  adminMetrics: AdminMetrics!
  adminOrders(limit: Int, offset: Int, status: String): [AdminOrder!]!
  adminOrder(orderId: String!): Order
  currentUser: User
  userOrders: [Order!]!
  epkBySlug(slug: String!): EPK
}

type Mutation {
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
  toggleProductStatus(id: ID!): Product!
  updateOrderStatus(orderId: ID!, status: String!): AdminOrder!
  updateUser(input: UpdateUserInput!): User!
  setUserRole(email: String!, role: String!): User!
}
`;

const schema = makeExecutableSchema({
  typeDefs: [unifiedSchema],
  resolvers,
});

export async function executeQuery(
  query: string,
  variables: Record<string, unknown>,
  request?: NextRequest
) {
  const req = {
    headers: request ? Object.fromEntries(request.headers) : {},
    cookies: request?.cookies
      ? Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))
      : {}
  };

  const context = await createContext({ req });

  const result = await graphql({
    schema,
    source: query,
    variableValues: variables,
    contextValue: context,
  });

  if (result.errors) {
    return { errors: result.errors.map(e => e.message) };
  }

  return result.data;
}
