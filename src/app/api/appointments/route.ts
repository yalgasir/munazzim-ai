import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/request-user";
import { isClockTime, isISODate, isLegacyTime, minutesSinceMidnight, optionalString } from "@/lib/validation";

/**
 * GET
 * Load all appointments for one user.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = await getCurrentUserId(req);

    const snapshot = await adminDb.collection("appointments").where("userId", "==", userId).get();

    const appointments = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error("GET /api/appointments error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to load appointments" },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Create a new appointment.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = await getCurrentUserId(req);

    const {
      userId: _ignoredUserId,
      title,
      date = null,
      time = null,
      startTime = null,
      endTime = null,
      attendanceStatus = "Upcoming",
      notes = null,
      location = null,
      description = null,
    } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "userId and title are required" },
        { status: 400 }
      );
    }

    const normalizedDate = optionalString(date);
    const normalizedTime = optionalString(time);
    const normalizedStartTime = optionalString(startTime);
    const normalizedEndTime = optionalString(endTime);

    if (normalizedDate !== null && !isISODate(normalizedDate)) {
      return NextResponse.json({ error: "date must use YYYY-MM-DD" }, { status: 400 });
    }
    if (normalizedTime !== null && !isLegacyTime(normalizedTime)) {
      return NextResponse.json({ error: "time must use HH:mm" }, { status: 400 });
    }
    if (normalizedStartTime !== null && !isClockTime(normalizedStartTime)) {
      return NextResponse.json({ error: "startTime must use HH:mm" }, { status: 400 });
    }
    if (normalizedEndTime !== null && !isClockTime(normalizedEndTime)) {
      return NextResponse.json({ error: "endTime must use HH:mm" }, { status: 400 });
    }
    if ((normalizedStartTime === null) !== (normalizedEndTime === null)) {
      return NextResponse.json({ error: "startTime and endTime must be provided together" }, { status: 400 });
    }
    if (normalizedStartTime && normalizedEndTime
      && minutesSinceMidnight(normalizedEndTime) <= minutesSinceMidnight(normalizedStartTime)) {
      return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
    }

    const normalizedTitle = optionalString(title);
    if (!normalizedTitle) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const storedTime = normalizedTime || (normalizedStartTime && normalizedEndTime
      ? `${normalizedStartTime} - ${normalizedEndTime}`
      : normalizedStartTime);
    const duplicateSnapshot = await adminDb.collection("appointments")
      .where("userId", "==", userId)
      .where("title", "==", normalizedTitle)
      .where("date", "==", normalizedDate)
      .where("time", "==", storedTime)
      .get();

    if (!duplicateSnapshot.empty) {
      const existing = duplicateSnapshot.docs[0];
      return NextResponse.json({
        success: true,
        duplicate: true,
        appointment: { id: existing.id, ...existing.data() },
      });
    }

    const newAppointment = {
      userId,
      title: normalizedTitle,
      date: normalizedDate,
      time: storedTime,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      attendanceStatus,
      notes: optionalString(notes),
      location: optionalString(location),
      description: optionalString(description),
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("appointments").add(newAppointment);

    return NextResponse.json({
      success: true,
      appointment: {
        id: docRef.id,
        ...newAppointment,
      },
    });
  } catch (error: any) {
    console.error("POST /api/appointments error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to create appointment" },
      { status: 500 }
    );
  }
}

/**
 * PATCH
 * Update an existing appointment.
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const userId = await getCurrentUserId(req);

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Appointment id is required" },
        { status: 400 }
      );
    }

    for (const field of ["date", "time", "startTime", "endTime", "notes", "location", "description"]) {
      if (updates[field] !== undefined) updates[field] = optionalString(updates[field]);
    }
    if (updates.date !== undefined && updates.date !== null && !isISODate(updates.date)) {
      return NextResponse.json({ error: "date must use YYYY-MM-DD" }, { status: 400 });
    }
    for (const field of ["time", "startTime", "endTime"]) {
      if (updates[field] !== undefined && updates[field] !== null
        && (field !== "time" ? !isClockTime(updates[field]) : !isLegacyTime(updates[field]))) {
        return NextResponse.json({ error: `${field} must use HH:mm` }, { status: 400 });
      }
    }
    if (updates.startTime !== undefined || updates.endTime !== undefined) {
      if ((updates.startTime === null) !== (updates.endTime === null)) {
        return NextResponse.json({ error: "startTime and endTime must be provided together" }, { status: 400 });
      }
      if (updates.startTime && updates.endTime
        && minutesSinceMidnight(updates.endTime) <= minutesSinceMidnight(updates.startTime)) {
        return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
      }
      if (updates.startTime && updates.endTime) {
        updates.time = `${updates.startTime} - ${updates.endTime}`;
      }
    }

    const appointmentRef = adminDb.collection("appointments").doc(id);
    const existing = await appointmentRef.get();
    const existingAppointment = existing.data();
    if (!existing.exists || existingAppointment?.userId !== userId) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    await appointmentRef.update(updates);

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error: any) {
    console.error("PATCH /api/appointments error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 * Delete an appointment.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = await getCurrentUserId(req);

    if (!id) {
      return NextResponse.json(
        { error: "Appointment id is required" },
        { status: 400 }
      );
    }

    const appointmentRef = adminDb.collection("appointments").doc(id);
    const existing = await appointmentRef.get();
    const existingAppointment = existing.data();
    if (!existing.exists || existingAppointment?.userId !== userId) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    await appointmentRef.delete();

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error: any) {
    console.error("DELETE /api/appointments error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
