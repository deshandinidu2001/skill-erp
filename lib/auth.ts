import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { ROLES, roleLabels } from "@/constants/roles";
import { users } from "@/services/mock/seed";

const loginSchema = z.object({
  role: z.enum(ROLES),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

function getIp(req: unknown) {
  const headers = (req as { headers?: Record<string, string> })?.headers;
  return headers?.["x-forwarded-for"]?.split(",")[0] || headers?.["x-real-ip"] || "local";
}

function assertLoginRateLimit(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return;
  }
  if (current.count >= 5) {
    throw new Error("Too many login attempts. Try again in 15 minutes.");
  }
  current.count += 1;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        const ip = getIp(req);
        assertLoginRateLimit(ip);

        if (!parsed.success) return null;

        const user =
          users.find((item) => item.role === parsed.data.role) ??
          ({
            id: `mock_${parsed.data.role}`,
            name: roleLabels[parsed.data.role],
            email: `${parsed.data.role}@skillengineering.lk`,
            role: parsed.data.role,
            clientToken:
              parsed.data.role === "client_user" ? "portal-skill-demo-2026" : undefined,
          } as const);

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientToken: user.clientToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientToken = user.clientToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.clientToken = token.clientToken;
      }
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}
