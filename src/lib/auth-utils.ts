import { PrivyClient } from '@privy-io/server-auth';

export interface UserContext {
  id?: string;
  email?: string;
  role?: 'ADMIN' | 'PUBLIC';
  isAuthenticated: boolean;
  privyUserId?: string;
}

const userCache = new Map<string, { user: UserContext; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

let _privyClient: PrivyClient | null = null;
function getPrivyClient(): PrivyClient {
  if (!_privyClient) {
    _privyClient = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      process.env.PRIVY_APP_SECRET!
    );
  }
  return _privyClient;
}

function evictExpiredEntries() {
  if (userCache.size <= MAX_CACHE_SIZE) return;
  const now = Date.now();
  for (const [key, value] of userCache) {
    if (now - value.timestamp >= CACHE_TTL) {
      userCache.delete(key);
    }
  }
  if (userCache.size > MAX_CACHE_SIZE) {
    const entries = [...userCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      userCache.delete(key);
    }
  }
}

export async function getUserFromPrivyToken(token: string): Promise<UserContext> {
  try {
    const cached = userCache.get(token);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.user;
    }

    const privy = getPrivyClient();
    const verifiedUser = await privy.verifyAuthToken(token);
    const userDetails = await privy.getUser(verifiedUser.userId);

    if (!userDetails.email?.address) {
      return { isAuthenticated: false };
    }

    const { prisma } = await import('@/lib/prisma');

    // Auto-create user on first login
    let dbUser = await prisma.user.findUnique({
      where: { email: userDetails.email.address },
      select: { id: true, email: true, role: true }
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: userDetails.email.address,
          privyUserId: verifiedUser.userId,
          role: 'PUBLIC',
        },
        select: { id: true, email: true, role: true }
      });
    }

    const user: UserContext = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as 'ADMIN' | 'PUBLIC',
      isAuthenticated: true,
      privyUserId: verifiedUser.userId
    };

    evictExpiredEntries();
    userCache.set(token, { user, timestamp: Date.now() });

    return user;
  } catch (error) {
    return { isAuthenticated: false };
  }
}

export async function verifyPrivyTokenFast(token: string): Promise<UserContext> {
  try {
    const privy = getPrivyClient();
    const verifiedUser = await privy.verifyAuthToken(token);
    return {
      isAuthenticated: true,
      privyUserId: verifiedUser.userId
    };
  } catch (error) {
    return { isAuthenticated: false };
  }
}

export function clearUserCache(token?: string) {
  if (token) {
    userCache.delete(token);
  } else {
    userCache.clear();
  }
}
