import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/request-user";
import { isClockTime, isISODate, optionalString } from "@/lib/validation";
import { withTimeout } from "@/lib/with-timeout";

/**
 * GET
 * Load all tasks for one user.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = await getCurrentUserId(req);

    const snapshot = await adminDb.collection("tasks").where("userId", "==", userId).get();

    const tasks = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to load tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Create a new task.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = await getCurrentUserId(req);

    const {
      userId: _ignoredUserId,
      title,
      description = null,
      priority = null,
      status = "Pending",
      date = null,
      time = null,
    } = body;

    const canonicalTitle = title || description;
    const normalizedDate = optionalString(date);
    const normalizedTime = optionalString(time);

    if (!userId || !canonicalTitle) {
      return NextResponse.json(
        { error: "userId and description are required" },
        { status: 400 }
      );
    }

    if (normalizedDate !== null && !isISODate(normalizedDate)) {
      return NextResponse.json({ error: "date must use YYYY-MM-DD" }, { status: 400 });
    }
    if (normalizedTime !== null && !isClockTime(normalizedTime)) {
      return NextResponse.json({ error: "time must use HH:mm" }, { status: 400 });
    }

    const duplicateSnapshot = await withTimeout(adminDb.collection("tasks")
      .where("userId", "==", userId)
      .where("title", "==", canonicalTitle)
      .where("date", "==", normalizedDate)
      .where("time", "==", normalizedTime)
      .get());

    if (!duplicateSnapshot.empty) {
      const existing = duplicateSnapshot.docs[0];
      return NextResponse.json({
        success: true,
        duplicate: true,
        task: { id: existing.id, ...existing.data() },
      });
    }

    const newTask = {
      userId,
      title: canonicalTitle,
      description,
      priority,
      status,
      date: normalizedDate,
      time: normalizedTime,
      isCompleted: status === "Done",
      createdAt: new Date().toISOString(),
    };

    const docRef = await withTimeout(adminDb.collection("tasks").add(newTask));

    return NextResponse.json({
      success: true,
      task: {
        id: docRef.id,
        ...newTask,
      },
    });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to create task" },
      { status: 500 }
    );
  }
}

/**
 * PATCH
 * Update an existing task.
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const userId = await getCurrentUserId(req);

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    if (updates.date !== undefined) {
      updates.date = optionalString(updates.date);
      if (updates.date !== null && !isISODate(updates.date)) {
        return NextResponse.json({ error: "date must use YYYY-MM-DD" }, { status: 400 });
      }
    }
    if (updates.time !== undefined) {
      updates.time = optionalString(updates.time);
      if (updates.time !== null && !isClockTime(updates.time)) {
        return NextResponse.json({ error: "time must use HH:mm" }, { status: 400 });
      }
    }

    if (updates.status) {
      updates.isCompleted = updates.status === "Done";
    }

    const taskRef = adminDb.collection("tasks").doc(id);
    const existing = await taskRef.get();
    const existingTask = existing.data();
    if (!existing.exists || existingTask?.userId !== userId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await taskRef.update(updates);

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error: any) {
    console.error("PATCH /api/tasks error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 * Delete a task.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = await getCurrentUserId(req);

    if (!id) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    const taskRef = adminDb.collection("tasks").doc(id);
    const existing = await taskRef.get();
    const existingTask = existing.data();
    if (!existing.exists || existingTask?.userId !== userId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    await taskRef.delete();

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error: any) {
    console.error("DELETE /api/tasks error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
