import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dest = searchParams.get('dest');
  const subId = searchParams.get('subId');

  if (!dest) {
    return NextResponse.json({ error: 'Missing destination URL' }, { status: 400 });
  }

  // Safe redirect validation: Ensure it is a valid web URL
  if (!dest.startsWith('http://') && !dest.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid destination URL' }, { status: 400 });
  }

  console.log(`[Affiliate Tracker] Redirecting to: ${dest} | SubID: ${subId || 'none'}`);

  return NextResponse.redirect(dest, 302);
}
