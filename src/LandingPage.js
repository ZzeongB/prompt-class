import { useState } from "react";
import CustomButton from "./components/CustomButton";
import { logEvent } from "./api/logEvent"; 

export default function LandingPage({ onStart }) {
  const [userId, setUserId] = useState("");

  const handleStart = async (isBaseline) => {
    if (userId.trim() === "") {
      alert("사용자 ID를 입력해주세요.");
      return;
    }

    sessionStorage.setItem("user_id", userId);
    sessionStorage.setItem("is_baseline", JSON.stringify(isBaseline));

    await logEvent("system_start", {
      selected_system: isBaseline ? "system1" : "system2",
    });

    onStart(isBaseline);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "#f5f5f5",
        gap: "16px",
      }}
    >
      <h1>Prompt System 실험</h1>

      <input
        type="text"
        placeholder="사용자 ID 입력"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{
          padding: "8px",
          fontSize: "16px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />

      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        <CustomButton color="object" onClick={() => handleStart(true)}>
          System 1 시작하기
        </CustomButton>
        <CustomButton color="group" onClick={() => handleStart(false)}>
          System 2 시작하기
        </CustomButton>
      </div>
    </div>
  );
}
