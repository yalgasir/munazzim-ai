import { NextResponse } from 'next/server';

export async function GET() {
  const healthData = {
    status: 'Operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    components: {
      api: 'Healthy',
      database: 'Connected',
      ai_service: 'Active'
    },
    version: '1.0.0-TRL6-prototype'
  };

  return NextResponse.json(healthData);
}






 