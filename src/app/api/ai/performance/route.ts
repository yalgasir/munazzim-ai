import { NextResponse } from 'next/server';
import { analyzeWorkspacePerformance } from '@/ai/flows/ai-performance-analysis-flow';
import { getCurrentUserId } from '@/lib/request-user';

export async function POST(req: Request) {
  try {
    const userId = getCurrentUserId(req);
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

    const [appointments, tasks] = await Promise.all([
      appointmentsResponse.json(),
      tasksResponse.json(),
    ]);
    const result = await analyzeWorkspacePerformance(
      Array.isArray(appointments) ? appointments : [],
      Array.isArray(tasks) ? tasks : []
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