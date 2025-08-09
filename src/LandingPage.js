import { useState } from "react";
import CustomButton from "./components/CustomButton";
import { logEvent } from "./api/logEvent"; 

export default function LandingPage({ onStart }) {
  const [language, setLanguage] = useState("ko");
  const [userId, setUserId] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [genAIFreq, setGenAIFreq] = useState("");
  const [genAITool, setGenAITool] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");
  const [systemOrder, setSystemOrder] = useState("");

  const handleStart = async () => {
    if (userId.trim() === "") {
      alert("사용자 ID를 입력해주세요.");
      return;
    }

    if (age.trim() === "" || gender.trim() === "" || occupation.trim() === "" || 
        genAIFreq.trim() === "" || genAITool.trim() === "" || englishLevel.trim() === "" ||
        systemOrder.trim() === "") {
      alert("모든 기본 정보를 입력해주세요.");
      return;
    }

    const demographicData = {
      age: age.trim(),
      gender: gender.trim(),
      occupation: occupation.trim(),
      gen_ai_frequency: genAIFreq.trim(),
      gen_ai_tool: genAITool.trim(),
      english_level: englishLevel.trim(),
      system_order: systemOrder.trim()
    };

    sessionStorage.setItem("user_id", userId);
    sessionStorage.setItem("demographic_data", JSON.stringify(demographicData));
    sessionStorage.setItem("system_order", systemOrder.trim());

    await logEvent("experiment_started", {
      language: language,
      demographic_data: demographicData,
    });

    onStart(language, systemOrder.trim());
  };

  const handleDevStart = () => {
    sessionStorage.setItem("user_id", "dev_user");
    sessionStorage.setItem("demographic_data", JSON.stringify({
      age: "25",
      gender: "other",
      occupation: "developer",
      gen_ai_frequency: "daily",
      gen_ai_tool: "ChatGPT",
      english_level: "fluent",
      system_order: "system1_first"
    }));
    sessionStorage.setItem("system_order", "system1_first");
    onStart(language, "system1_first");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        flexDirection: "column",
        background: "#f5f5f5",
        gap: "10px",
        overflowY: "auto",
        padding: "20px"
      }}
    >
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "20px", 
        width: "100%",
        maxWidth: "500px",
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        alignSelf: "center",
        border: "1px solid #e8ecef"
      }}>
        
        {/* Header */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: "5px" 
        }}>
          <h1 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "24px", 
            fontWeight: "600", 
            color: "#2c3e50",
            letterSpacing: "0.5px"
          }}>
            {language === "ko" ? "Prompt System 실험" : "Prompt System Experiment"}
          </h1>
          <div style={{
            fontSize: "12px",
            color: "#7f8c8d",
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            {language === "ko" ? "참가자 정보 입력" : "Participant Information"}
          </div>
        </div>

        {/* Language Selection */}
        <div style={{ marginBottom: "5px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontWeight: "600",
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "언어 선택 / Language Selection" : "Language Selection / 언어 선택"}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #dfe6e9",
              width: "100%",
              backgroundColor: "white",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* User ID */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600",
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "사용자 ID" : "User ID"}
          </label>
          <input
            type="text"
            placeholder={language === "ko" ? "사용자 ID 입력" : "Enter User ID"}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #dfe6e9",
              width: "96%",
              backgroundColor: "white",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          />
        </div>
        
        {/* Age */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600",
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "나이" : "Age"}
          </label>
          <input
            type="number"
            placeholder={language === "ko" ? "나이" : "Age"}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #dfe6e9",
              width: "96%",
              backgroundColor: "white",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          />
        </div>
        
        {/* Gender */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600",
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "성별" : "Gender"}
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #dfe6e9",
              width: "100%",
              backgroundColor: "white",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          >
            <option value="">{language === "ko" ? "성별 선택" : "Select Gender"}</option>
            <option value="male">{language === "ko" ? "남성" : "Male"}</option>
            <option value="female">{language === "ko" ? "여성" : "Female"}</option>
            <option value="other">{language === "ko" ? "기타" : "Other"}</option>
          </select>
        </div>
        
        {/* Occupation */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600",
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "직업" : "Occupation"}
          </label>
          <input
            type="text"
            placeholder={language === "ko" ? "직업" : "Occupation"}
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #dfe6e9",
              width: "96%",
              backgroundColor: "white",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          />
        </div>
        
        {/* AI Frequency */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600",
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "생성형 AI 사용 빈도" : "Generative AI Usage Frequency"}
          </label>
          <select
            value={genAIFreq}
            onChange={(e) => setGenAIFreq(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #dfe6e9",
              width: "100%",
              backgroundColor: "white",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          >
            <option value="">{language === "ko" ? "생성형 AI 사용 빈도" : "Select Frequency"}</option>
            <option value="daily">{language === "ko" ? "매일" : "Daily"}</option>
            <option value="weekly">{language === "ko" ? "주 2-3회" : "2-3 times per week"}</option>
            <option value="monthly">{language === "ko" ? "월 2-3회" : "2-3 times per month"}</option>
            <option value="rarely">{language === "ko" ? "거의 사용하지 않음" : "Rarely"}</option>
            <option value="never">{language === "ko" ? "사용하지 않음" : "Never"}</option>
          </select>
        </div>
        
        {/* AI Tool */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600",
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "주로 사용하는 생성형 AI 도구" : "Primary Generative AI Tool"}
          </label>
          <input
            type="text"
            placeholder={language === "ko" ? "예: ChatGPT, Claude, 없음" : "e.g., ChatGPT, Claude, None"}
            value={genAITool}
            onChange={(e) => setGenAITool(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #dfe6e9",
              width: "96%",
              backgroundColor: "white",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          />
        </div>
        
        {/* English Level */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "6px", 
            fontWeight: "600",
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "영어 수준" : "English Level"}
          </label>
          <select
            value={englishLevel}
            onChange={(e) => setEnglishLevel(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #dfe6e9",
              width: "100%",
              backgroundColor: "white",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          >
            <option value="">{language === "ko" ? "영어 수준" : "Select Level"}</option>
            <option value="native">{language === "ko" ? "모국어 수준" : "Native"}</option>
            <option value="fluent">{language === "ko" ? "유창함" : "Fluent"}</option>
            <option value="intermediate">{language === "ko" ? "중급" : "Intermediate"}</option>
            <option value="beginner">{language === "ko" ? "초급" : "Beginner"}</option>
          </select>
        </div>
        
        {/* System Order */}
        <div style={{ 
          marginTop: "10px", 
          padding: "16px", 
          border: "1px solid #dfe6e9", 
          borderRadius: "8px", 
          backgroundColor: "#f8f9fa" 
        }}>
          <label style={{ 
            display: "block", 
            marginBottom: "12px", 
            fontWeight: "600", 
            fontSize: "14px",
            color: "#2c3e50"
          }}>
            {language === "ko" ? "시스템 실험 순서 선택:" : "System Experiment Order:"}
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="systemOrder"
                value="system1_first"
                checked={systemOrder === "system1_first"}
                onChange={(e) => setSystemOrder(e.target.value)}
                style={{ marginRight: "10px", transform: "scale(1.1)" }}
              />
              <span style={{ fontSize: "14px", color: "#34495e" }}>
                {language === "ko" ? "System 1 → 평가 → System 2 → 평가" : "System 1 → Evaluation → System 2 → Evaluation"}
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="systemOrder"
                value="system2_first"
                checked={systemOrder === "system2_first"}
                onChange={(e) => setSystemOrder(e.target.value)}
                style={{ marginRight: "10px", transform: "scale(1.1)" }}
              />
              <span style={{ fontSize: "14px", color: "#34495e" }}>
                {language === "ko" ? "System 2 → 평가 → System 1 → 평가" : "System 2 → Evaluation → System 1 → Evaluation"}
              </span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          <CustomButton color="object" onClick={handleStart} style={{ width: "100%" }}>
            {language === "ko" ? "실험 시작하기" : "Start Experiment"}
          </CustomButton>
          
          {/* Dev version button */}
          <div style={{ 
            borderTop: "1px solid #dfe6e9", 
            paddingTop: "12px", 
            textAlign: "center" 
          }}>
            <div style={{ 
              fontSize: "12px", 
              color: "#7f8c8d", 
              marginBottom: "8px",
              fontStyle: "italic"
            }}>
              {language === "ko" ? "개발자용 (설문 생략)" : "Developer Mode (Skip Survey)"}
            </div>
            <CustomButton 
              color="neutral" 
              onClick={handleDevStart}
              style={{ 
                width: "100%", 
                fontSize: "12px",
                backgroundColor: "#6c757d",
                border: "1px solid #6c757d"
              }}
            >
              {language === "ko" ? "Dev 모드로 시작" : "Start in Dev Mode"}
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
}
