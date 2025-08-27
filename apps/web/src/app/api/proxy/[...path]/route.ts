// app/api/proxy/[...path]/route.ts

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {

  const studioBaseUrl = process.env.STUDIO_BASE_URL;
  const cookieName = process.env.COOKIE_NAME;

  if (!studioBaseUrl || !cookieName) {
    console.error('Missing environment variables for proxy');
    return new Response('Proxy configuration error.', { status: 500 });
  }


  const cookieStore = cookies();
  const accessToken = (await cookieStore).get(cookieName)?.value;

  if (!accessToken) {

    return new Response('Access token not found.', { status: 401 });
  }

  const destinationPath = (await params).path.join('/');
  const targetUrl = `${studioBaseUrl}/${destinationPath}`;

  try {
    console.log(targetUrl)
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {

        'Authorization': `Bearer ${accessToken}`,
    
        ...(req.headers.get('content-type') && {
          'Content-Type': req.headers.get('content-type')!,
        }),
      },

      body: req.body,

      // @ts-expect-error
      duplex: 'half',
    });


    return response;
    
  } catch (error) {
    console.error('Proxy fetch error:', error);
    return new Response('Error proxying request.', { status: 502 }); 
  }
}


export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;