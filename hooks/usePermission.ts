"use client";

import { canPerform, hasModuleAccess } from "@/lib/permissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function usePermission() {
  const { role } = useCurrentUser();

  return {
    can: (
      action: "create" | "edit" | "approve" | "delete" | "viewFinancials" | "manageUsers",
      resource = "",
    ) => canPerform(role, action, resource),
    canAccessModule: (module: string) => hasModuleAccess(role, module),
  };
}
