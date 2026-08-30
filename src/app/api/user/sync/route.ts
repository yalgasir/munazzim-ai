import { NextResponse } from 'next/server';

/**
 * Local development user sync.
 * In local mode we do not write the user from the server route.
 * Tasks, appointments, and other data continue to use Firebase Emulator.
 */

export async function POST(req: Request) {
  try {
    const { uid, email, displayName } = await req.json();

    return NextResponse.json({
      success: true,
      ip: '127.0.0.1',
      local: true,
      user: {
        uid,
        email,
        displayName
      }
    });

  } catch (error: any) {
    console.error('User sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
