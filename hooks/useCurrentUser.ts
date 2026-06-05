"use client";

import { useSession } from "next-auth/react";

export function useCurrentUser() {
  const { data, status } = useSession();
  return {
    user: data?.user,
    role: data?.user?.role,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
