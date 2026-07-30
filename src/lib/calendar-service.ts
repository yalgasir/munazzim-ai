import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

/**
 * @fileOverview Service for handling external calendar synchronization logic.
 */

export async function syncGoogleCalendar(userId: string) {
  try {
    // In a real app, this would fetch from Google Calendar API using an OAuth token
    // For this prototype, we simulate fetching external events
    const mockExternalEvents = [
      {
        externalId: "gcal_123",
        title: "Product Sync (Imported)",
        date: new Date().toISOString().split('T')[0],
        startTime: "10:00",
        endTime: "11:00",
        location: "Google Meet",
        description: "Weekly product alignment",
        source: "calendar_import"
      }
    ];

    let newCount = 0;
    const appointmentsRef = collection(db!, "appointments");

    for (const event of mockExternalEvents) {
      // Prevent duplicates by checking externalId
      const q = query(appointmentsRef, 
        where("userId", "==", userId), 
        where("externalId", "==", event.externalId)
      );
      
      const existing = await getDocs(q);
      
      if (existing.empty) {
        await addDoc(appointmentsRef, {
          ...event,
          userId,
          createdAt: new Date().toISOString()
        });
        newCount++;
      } else {
        // Update existing if needed
        const docId = existing.docs[0].id;
        await updateDoc(doc(db!, "appointments", docId), {
          ...event,
          updatedAt: new Date().toISOString()
        });
      }
    }

    return { success: true, count: newCount };
  } catch (error) {
    console.error("Calendar Sync Error:", error);
    return { success: false, count: 0 };
  }
}
