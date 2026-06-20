import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Server-side API route to synchronize user data and capture IP addresses.
 * captures IP from headers to ensure accuracy during registration and login.
 */

export async function POST(req: Request) {
  try {
    const { uid, email, displayName } = await req.json();
    
    // Capture Client IP Address
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    const now = new Date().toISOString();

    if (!userSnap.exists()) {
      // New User Registration
      // Storing all required fields including Registration IP
      await setDoc(userRef, {
        uid,
        email: email || 'guest@munazzim.app',
        displayName: displayName || 'Guest User',
        registrationDate: now,
        registrationIP: ip,
        lastLoginDate: now,
        lastLoginIP: ip,
        status: 'Active',
        createdAt: serverTimestamp(),
      });
    } else {
      // Existing User Login Update
      // Updates Last Login IP Address and Last Login Date/Time
      await setDoc(userRef, {
        lastLoginDate: now,
        lastLoginIP: ip,
        status: 'Active'
      }, { merge: true });
    }

    return NextResponse.json({ success: true, ip });
  } catch (error: any) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
