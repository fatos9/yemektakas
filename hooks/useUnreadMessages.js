import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export function useUnreadMessages(userId) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let total = 0;

      snap.docs.forEach((chatDoc) => {
        const chatId = chatDoc.id;

        const msgRef = collection(db, "chats", chatId, "messages");
        const msgQ = query(
          msgRef,
          where("isRead", "==", false),
          where("sender", "!=", userId)
        );

        onSnapshot(msgQ, (mSnap) => {
          total += mSnap.size;
          setUnreadCount(total);
        });
      });
    });

    return () => unsub();
  }, [userId]);

  return unreadCount;
}
