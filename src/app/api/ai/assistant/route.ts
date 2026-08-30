import { NextResponse } from 'next/server';
import { analyzeFullSchedule } from '@/ai/flows/ai-schedule-optimizer-flow';
import { getCurrentUserId } from '@/lib/request-user';

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

    const [appointmentsResponse, tasksResponse] = await Promise.all([
      fetch(`${new URL('/api/appointments', req.url)}?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      }),
      fetch(`${new URL('/api/tasks', req.url)}?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      }),
    ]);

    if (!appointmentsResponse.ok || !tasksResponse.ok) {
      return NextResponse.json(
        { error: 'Could not load the current schedule.' },
        { status: 502 }
      );
    }

    const appointments = await appointmentsResponse.json();
    const tasks = await tasksResponse.json();
    const result = await analyzeFullSchedule(
      Array.isArray(appointments) ? appointments : [],
      Array.isArray(tasks) ? tasks : [],
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