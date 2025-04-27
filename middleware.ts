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
                // Does not match digits or is not of length of six digits redirect to 404
            }

            if (id === '123456') {
                return;
            } // To be strictly removed in Production

            const cookieStore = await cookies();
            const accessCookie = cookieStore.get(`sessionAccess:${id}`);
            const participantCookie = cookieStore.get(`participant-${id}`);

            const isValidSession = accessCookie && accessCookie.value === 'true';
            const isValidParticipant = participantCookie;

            if ((!isValidSession || !isValidParticipant)) {
                cookieStore.delete(`sessionAccess:${id}`);
                cookieStore.delete(`participant-${id}`);
                return NextResponse.redirect(new URL('/404', request.url));
            }

            const supabase = await createClient();
            const { data, error } = await supabase
                .from('session_participants')
                .select('id')
                .match({
                    id: participantCookie?.value,
                    session_id: id
                })
                .single();

            if (!data || error) {
                cookieStore.delete(`sessionAccess:${id}`);
                cookieStore.delete(`participant-${id}`);
                return NextResponse.redirect(new URL('/404', request.url));
            }

            cookieStore.set(`sessionAccess:${id}`, 'true', {
                httpOnly: true,
                maxAge: 3600, // expires in 1 hour
                path: '/',
                secure: process.env.NODE_ENV === 'production', // only secure on HTTPS in prod
                sameSite: 'lax', // good for CSRF protection without breaking UX
            });

            cookieStore.set(`participant-${id}`, participantCookie.value, {
                httpOnly: true,
                maxAge: 3600, // expires in 1 hour
                path: '/',
                secure: process.env.NODE_ENV === 'production', // only secure on HTTPS in prod
                sameSite: 'lax', // good for CSRF protection without breaking UX
            });
            // Resetting the cookies, the old ones get overridden

            const updatedUrl = request.nextUrl;
            const participantIdFromCookie = participantCookie?.value;
            const participantIdFromQuery = updatedUrl.searchParams.get('participantId');

            if (participantIdFromQuery !== participantIdFromCookie) {
                updatedUrl.searchParams.set('participantId', participantCookie?.value!);
                return NextResponse.redirect(updatedUrl); // Redirect to the same page with the participantId
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/session/:id*'],
};