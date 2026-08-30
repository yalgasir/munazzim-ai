/**
 * Calendar synchronization service.
 *
 * Browser
 *   ↓
 * Next.js API
 *   ↓
 * Firebase Emulator
 */

export async function syncGoogleCalendar(
  userId: string
) {
  try {
    const response = await fetch(
      "/api/calendar-sync",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        "Calendar sync failed"
      );
    }

    const data = await response.json();

    return {
      success: Boolean(data.success),
      count: Number(data.count || 0),
    };
  } catch (error) {
    console.error(
      "Calendar Sync Error:",
      error
    );

    return {
      success: false,
      count: 0,
    };
  }
}
