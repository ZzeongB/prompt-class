import { useState } from "react";
import CustomButton from "./components/CustomButton";
import { logEvent } from "./api/logEvent"; 

export default function LandingPage({ onStart }) {
  const [userId, setUserId] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [genAIFreq, setGenAIFreq] = useState("");
  const [genAITool, setGenAITool] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");

  const handleStart = async (isBaseline) => {
    if (userId.trim() === "") {
      alert("사용자 ID를 입력해주세요.");
      return;
    }

    if (age.trim() === "" || gender.trim() === "" || occupation.trim() === "" || 
        genAIFreq.trim() === "" || genAITool.trim() === "" || englishLevel.trim() === "") {
      alert("모든 기본 정보를 입력해주세요.");
      return;
    }

    const demographicData = {
      age: age.trim(),
      gender: gender.trim(),
      occupation: occupation.trim(),
      gen_ai_frequency: genAIFreq.trim(),
      gen_ai_tool: genAITool.trim(),
      english_level: englishLevel.trim()
    };

    sessionStorage.setItem("user_id", userId);
    sessionStorage.setItem("is_baseline", JSON.stringify(isBaseline));
    sessionStorage.setItem("demographic_data", JSON.stringify(demographicData));

    await logEvent("system_start", {
      selected_system: isBaseline ? "system1" : "system2",
      demographic_data: demographicData,
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

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "300px" }}>
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
        
        <input
          type="number"
          placeholder="나이"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value="">성별 선택</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
          <option value="other">기타</option>
        </select>
        
        <input
          type="text"
          placeholder="직업"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        
        <select
          value={genAIFreq}
          onChange={(e) => setGenAIFreq(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value="">생성형 AI 사용 빈도</option>
          <option value="daily">매일</option>
          <option value="weekly">주 2-3회</option>
          <option value="monthly">월 2-3회</option>
          <option value="rarely">거의 사용하지 않음</option>
          <option value="never">사용하지 않음</option>
        </select>
        
        <input
          type="text"
          placeholder="주로 사용하는 생성형 AI 도구 (예: ChatGPT, Claude, 없음)"
          value={genAITool}
          onChange={(e) => setGenAITool(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        
        <select
          value={englishLevel}
          onChange={(e) => setEnglishLevel(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value="">영어 수준</option>
          <option value="native">모국어 수준</option>
          <option value="fluent">유창함</option>
          <option value="intermediate">중급</option>
          <option value="beginner">초급</option>
        </select>
      </div>

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
