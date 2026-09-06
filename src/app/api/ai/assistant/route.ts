import { NextResponse } from 'next/server';
import { analyzeFullSchedule } from '@/ai/flows/ai-schedule-optimizer-flow';
import { adminDb } from '@/lib/firebase-admin';
import { getCurrentUserId } from '@/lib/request-user';

async function loadUserCollection(collectionName: 'appointments' | 'tasks', userId: string) {
  const snapshot = await adminDb
    .collection(collectionName)
    .where('userId', '==', userId)
    .get();

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = await getCurrentUserId(req);
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json(
        { error: 'userId and prompt are required' },
        { status: 400 }
      );
    }

    const [appointments, tasks] = await Promise.all([
      loadUserCollection('appointments', userId),
      loadUserCollection('tasks', userId),
    ]);

    const result = await analyzeFullSchedule(
      appointments,
      tasks,
      prompt
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/ai/assistant error:', error);
    const isAuth = error instanceof Error && error.message === 'UNAUTHENTICATED';
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI request failed.' },
      { status: isAuth ? 401 : 502 }
    );
  }
}