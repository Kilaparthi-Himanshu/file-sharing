import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith('/room')) {
        // Match routes like /room/abc where abc is not a number
        const postMatch = pathname.match(/^\/room\/([^/]+)$/);

        if (postMatch) {
            const id = postMatch[1];
            if (!/^\d+$/.test(id) || id.length !== 6) {
                return NextResponse.redirect(new URL('/404', request.url));
            } // Does not match digits or is not of length of six digits redirect to 404
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/room/:id*'],
};