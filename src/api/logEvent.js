// utils/logger.js
export async function logEvent(event, details = {}) {
  try {
    const sessionId =
      sessionStorage.getItem("session_id") || generateSessionId();

    console.log("[logEvent] Logging event:", { event, details, sessionId });

    await fetch("http://127.0.0.1:5000/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors", // CORS 모드 명시
      body: JSON.stringify({
        event,
        details,
        session_id: sessionId,
        user_id: "debug", // 로그인 연동 시 실제 사용자 ID 넣을 수 있음
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
