import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/request-user";

/**
 * GET
 * Load AI history for one user.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = await getCurrentUserId(req);

    const snapshot = await adminDb.collection("ai_logs").where("userId", "==", userId).get();

    const logs = snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort((a: any, b: any) =>
        String(b.createdAt || "").localeCompare(
          String(a.createdAt || "")
        )
      )
      .slice(0, 5);

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET /api/ai-logs error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to load AI history" },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Save a new local AI analysis.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = await getCurrentUserId(req);

    const {
      userId: _ignoredUserId,
      prompt,
      analysis = "",
      recommendation = "",
      model = "Llama 3.2",
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "userId and prompt are required" },
        { status: 400 }
      );
    }

    const newLog = {
      userId,
      prompt,
      analysis,
      recommendation,
      createdAt: new Date().toISOString(),
      model,
    };

    const docRef = await adminDb.collection("ai_logs").add(newLog);

    return NextResponse.json({
      success: true,
      log: {
        id: docRef.id,
        ...newLog,
      },
    });
  } catch (error: any) {
    console.error("POST /api/ai-logs error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to save AI history" },
      { status: 500 }
    );
  }
}
