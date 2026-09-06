import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/request-user";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId(req);

    const mockExternalEvents = [
      {
        externalId: "gcal_123",
        title: "Product Sync (Imported)",
        date: new Date().toISOString().split("T")[0],
        startTime: "10:00",
        endTime: "11:00",
        time: "10:00",
        location: "Google Meet",
        description: "Weekly product alignment",
        source: "calendar_import",
        attendanceStatus: "Upcoming",
      },
    ];

    let newCount = 0;

    const appointmentsRef = adminDb.collection("appointments");

    for (const event of mockExternalEvents) {
      const existing = await appointmentsRef
        .where("userId", "==", userId)
        .where("externalId", "==", event.externalId)
        .get();

      if (existing.empty) {
        await appointmentsRef.add({
          ...event,
          userId,
          createdAt: new Date().toISOString(),
        });

        newCount++;
      } else {
        const docId =
          existing.docs[0].id;

        await appointmentsRef.doc(docId).update({
          ...event,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: newCount,
    });
  } catch (error: any) {
    console.error(
      "Calendar Sync API Error:",
      error
    );

    const status = error?.message === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json(
      {
        success: false,
        count: 0,
        error:
          error?.message ||
          "Calendar sync failed",
      },
      { status }
    );
  }
}
