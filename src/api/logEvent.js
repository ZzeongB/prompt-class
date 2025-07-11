export async function logEvent(event, details = {}) {
  try {
    const sessionId =
      sessionStorage.getItem("session_id") || generateSessionId();
    const userId = sessionStorage.getItem("user_id") || "unknown"; // ✅ 수정

    console.log("[logEvent] Logging event:", {
      event,
      details,
      sessionId,
      userId,
    });

    await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
      body: JSON.stringify({
        event,
        details,
        session_id: sessionId,
        user_id: userId, // ✅ 수정
      }),
    });
  } catch (err) {
    console.warn("[logEvent] Logging failed:", err);
  }
}

function generateSessionId() {
  const id = crypto.randomUUID();
  sessionStorage.setItem("session_id", id);
  return id;
}
