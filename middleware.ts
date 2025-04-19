import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from './app/utils/supabase/server';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith('/session')) {
        // Match routes like /session/abc where abc is not a number
        const postMatch = pathname.match(/^\/session\/([^/]+)$/);

        if (postMatch) {
            const id = postMatch[1];
            if (!/^\d+$/.test(id) || id.length !== 6) {
                return NextResponse.redirect(new URL('/404', request.url));
            } // Does not match digits or is not of length of six digits redirect to 404

            const cookieStore = await cookies();
            const accessCookie = cookieStore.get(`sessionAccess:${id}`);

            if ((!accessCookie || accessCookie.value != 'true') && (id != '123456'))
                return NextResponse.redirect(new URL('/404', request.url));
                // && (id != '123456') to be removed in production

            const supabase = await createClient();
            const { data: session, error } = await supabase
                .from('sessions')
                .select('id')
                .eq('id', id)
                .single();

            if (!session || error)
                return NextResponse.redirect(new URL('/404', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/session/:id*'],
};