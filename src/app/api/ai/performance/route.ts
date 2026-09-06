import { NextResponse } from 'next/server';
import { analyzeWorkspacePerformance } from '@/ai/flows/ai-performance-analysis-flow';
import { adminDb } from '@/lib/firebase-admin';
import { getCurrentUserId } from '@/lib/request-user';

async function loadUserCollection(collectionName: 'appointments' | 'tasks', userId: string) {
  const snapshot = await adminDb.collection(collectionName).where('userId', '==', userId).get();

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId(req);
    const [appointments, tasks] = await Promise.all([
      loadUserCollection('appointments', userId),
      loadUserCollection('tasks', userId),
    ]);

    const result = await analyzeWorkspacePerformance(
      appointments,
      tasks
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/ai/performance error:', error);
    const isAuth = error instanceof Error && error.message === 'UNAUTHENTICATED';
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI performance analysis failed.' },
      { status: isAuth ? 401 : 502 }
    );
  }
}