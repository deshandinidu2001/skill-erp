import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { Role } from "@/constants/roles";
import { hasModuleAccess, moduleFromPath } from "@/lib/permissions";

const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!token && !isPublic && !pathname.startsWith("/client")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const role = token?.role as Role | undefined;
  if (!role) return NextResponse.next();

  if (role === "client_user" && !pathname.startsWith("/client")) {
    const clientToken = token?.clientToken || "portal";
    return NextResponse.redirect(new URL(`/client/${clientToken}`, req.url));
  }

  // Allow logged-in users to preview client portal links directly
  // if (pathname.startsWith("/client") && role !== "client_user" && role !== "super_admin") {
  //   return NextResponse.redirect(new URL("/dashboard", req.url));
  // }

  if (pathname.startsWith("/stock") && !canAccessStockPath(role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/accounting/chart-of-accounts") && role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/reports/payroll") && !["hr_manager", "finance_manager", "super_admin"].includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/reports/project-pnl") && !["accountant", "finance_manager", "super_admin"].includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/admin") && role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const routeModule = moduleFromPath(pathname.replace(/^\/dashboard/, "") || "/dashboard");
  if (!hasModuleAccess(role, routeModule)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

function canAccessStockPath(role: Role, pathname: string) {
  if (role === "super_admin") return true;
  if (role === "store_keeper") {
    return pathname.startsWith("/stock/goods-receipts") || pathname.startsWith("/stock/inventory");
  }
  if (role === "project_manager") {
    return pathname.startsWith("/stock/requests");
  }
  if (role === "qs_manager" || role === "qs_engineer") {
    return pathname === "/stock/requests" || /^\/stock\/requests\/[^/]+$/.test(pathname);
  }
  if (role === "finance_manager") {
    return pathname === "/stock/purchase-orders" || (/^\/stock\/purchase-orders\/[^/]+$/.test(pathname) && pathname !== "/stock/purchase-orders/new");
  }
  if (role === "stock_manager") return true;
  return hasModuleAccess(role, "stock");
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)"],
};
