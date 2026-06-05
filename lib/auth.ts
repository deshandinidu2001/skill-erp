import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  if (current.count >= 5) throw new Error("Too many login attempts. Try again in 15 minutes.");
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = getIp(req);
        assertLoginRateLimit(ip);
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const supabase = createAdminClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (authError || !authData.user) return null;

        const { data: appUser } = await supabase
          .from("app_users")
          .select("id, full_name, role, is_active")
          .eq("id", authData.user.id)
          .single();
        if (!appUser || !appUser.is_active) return null;

        await supabase.from("app_users").update({ last_login_at: new Date().toISOString() }).eq("id", appUser.id);

        return {
          id: appUser.id,
          name: appUser.full_name,
          email: parsed.data.email,
          role: appUser.role,
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
  secret: process.env.NEXTAUTH_SECRET,
};

export function getSession() {
  return getServerSession(authOptions);
}
