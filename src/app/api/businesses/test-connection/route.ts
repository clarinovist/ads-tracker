import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ad_account_id, access_token } = body;

        if (!ad_account_id || !access_token) {
            return NextResponse.json(
                { error: 'Ad Account ID and Access Token are required' },
                { status: 400 }
            );
        }

        // We try to fetch insights for "today" as a lightweight check.
        // If the token or ID is invalid, this will throw or return an error from Meta.
        // We use a safe date (e.g., yesterday) to ensure data *might* be there, 
        // but really we just check if the request is authorized.

        try {
            // We reuse the existing fetch function but we need to handle the case where it might fail
            // due to permissions even if the token is "valid" for other things, but usually this is good enough.
            // A better check might be just hitting `me` or the ad account field, but keeping it simple using existing lib functions.
            // However, fetchAdAccountInsights might return null if no data, which is NOT an error.
            // We want to catch actual API errors (invalid token, invalid ID).

            // Actually, to be safer and not rely on insights potentially being empty, 
            // let's do a direct fetch here to /<ad_account_id>?fields=name,currency
            const url = `https://graph.facebook.com/v19.0/${ad_account_id}?fields=name,currency,account_status&access_token=${access_token}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.error) {
                return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                data: {
                    name: data.name,
                    currency: data.currency,
                    status: data.account_status
                }
            });

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            return NextResponse.json({ success: false, error: msg }, { status: 500 });
        }

    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
