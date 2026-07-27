import { clerkMiddleware } from "@clerk/nextjs/server"

// Initialize Clerk middleware for authentication
export default clerkMiddleware()

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Match all routes except:
    // - _next (Next.js internals)
    // - Static files (html, css, js, images, fonts, documents, archives, manifests)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always match API and tRPC routes
    "/(api|trpc)(.*)",
  ],
} 