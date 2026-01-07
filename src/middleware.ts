import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;

    // Paths that don't require authentication
    if (request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/api/auth/login') ||
        request.nextUrl.pathname.startsWith('/api/auth/setup')) {
        if (session) {
            try {
                await decrypt(session);
                // Allow setup endpoint even if logged in
                if (request.nextUrl.pathname.startsWith('/api/auth/setup')) {
                    return NextResponse.next();
                }
                return NextResponse.redirect(new URL('/', request.url));
            } catch (e) {
                // Invalid session, let them go to login
            }
        }
        return NextResponse.next();
    }

    // Check auth for everything else
    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        await decrypt(session);
        return NextResponse.next();
    } catch (error) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth/login (handled in middleware)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
};
