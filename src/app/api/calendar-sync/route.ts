import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getCurrentUserId } from "@/lib/request-user";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const userId = getCurrentUserId(req);

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

    const appointmentsRef = collection(
      db,
      "appointments"
    );

    for (const event of mockExternalEvents) {
      const q = query(
        appointmentsRef,
        where("userId", "==", userId),
        where(
          "externalId",
          "==",
          event.externalId
        )
      );

      const existing = await getDocs(q);

      if (existing.empty) {
        await addDoc(
          appointmentsRef,
          {
            ...event,
            userId,
            createdAt:
              new Date().toISOString(),
          }
        );

        newCount++;
      } else {
        const docId =
          existing.docs[0].id;

        await updateDoc(
          doc(
            db,
            "appointments",
            docId
          ),
          {
            ...event,
            updatedAt:
              new Date().toISOString(),
          }
        );
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

    return NextResponse.json(
      {
        success: false,
        count: 0,
        error:
          error?.message ||
          "Calendar sync failed",
      },
      { status: 500 }
    );
  }
}
