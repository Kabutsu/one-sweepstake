import { db } from "@/db";
import { users } from "@/db/schema";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key");
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  profileCustomized: boolean;
  isAdmin: boolean;
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function getAuthUser(token?: string): Promise<AuthUser | null> {
  if (!token) return null;

  const userId = await verifyToken(token);
  if (!userId) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    profileCustomized: user.profileCustomized,
    isAdmin: user.isAdmin,
  };
}

export function getAuthCookieOptions(maxAge: number = TOKEN_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}
