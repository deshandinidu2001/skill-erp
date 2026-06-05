import type { Role } from "@/constants/roles";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      clientToken?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    clientToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    clientToken?: string;
  }
}
