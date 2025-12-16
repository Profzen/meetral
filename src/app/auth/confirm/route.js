// src/app/auth/confirm/route.js
// Email verification callback from Supabase
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  if (token_hash && type) {
    // Redirect to login with success message
    return NextResponse.redirect(
      new URL(`/auth/login?verified=true&token_hash=${token_hash}&type=${type}`, requestUrl.origin)
    );
  }

  // Error or missing parameters
  return NextResponse.redirect(
    new URL('/auth/login?error=verification_failed', requestUrl.origin)
  );
}
