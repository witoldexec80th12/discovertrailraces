import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/profile(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/profile(.*)",
    "/api/favorites(.*)",
    "/api/save-calendar(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
  ],
};
