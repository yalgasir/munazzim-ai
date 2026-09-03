import { NextResponse } from 'next/server';
import { analyzeWorkspacePerformance } from '@/ai/flows/ai-performance-analysis-flow';
import { db } from '@/lib/firebase';
import { getCurrentUserId } from '@/lib/request-user';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

async function loadUserCollection(collectionName: 'appointments' | 'tasks', userId: string) {
  const userQuery = query(
    collection(db, collectionName),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(userQuery);

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI performance analysis failed.' },
      { status: 502 }
    );
  }
}