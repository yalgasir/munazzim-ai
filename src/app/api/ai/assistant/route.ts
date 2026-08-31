import { NextResponse } from 'next/server';
import { analyzeFullSchedule } from '@/ai/flows/ai-schedule-optimizer-flow';
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
    const body = await req.json();
    const userId = getCurrentUserId(req);
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI request failed.' },
      { status: 502 }
    );
  }
}