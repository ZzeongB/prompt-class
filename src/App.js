import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import AppUI from "./AppUI";
import SurveyPage from "./SurveyPage";

export default function App() {
  const [phase, setPhase] = useState(() => {
    const stored = sessionStorage.getItem("experiment_phase");
    return stored || "landing";
  });
  const [language, setLanguage] = useState(() => {
    const stored = sessionStorage.getItem("language");
    return stored || "ko";
  });
  const [system1StartTime, setSystem1StartTime] = useState(null);
  const [system2StartTime, setSystem2StartTime] = useState(null);

  useEffect(() => {
    sessionStorage.setItem("experiment_phase", phase);
  }, [phase]);

  useEffect(() => {
    sessionStorage.setItem("language", language);
  }, [language]);

  const handleLandingComplete = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setPhase("system1");
    setSystem1StartTime(Date.now());
  };

  const handleSystem1Complete = () => {
    setPhase("survey1");
  };

  const handleSurvey1Complete = () => {
    setPhase("system2");
    setSystem2StartTime(Date.now());
  };

  const handleSystem2Complete = () => {
    setPhase("survey2");
  };

  const handleSurvey2Complete = () => {
    setPhase("complete");
  };

  const handleExperimentRestart = () => {
    setPhase("landing");
    setSystem1StartTime(null);
    setSystem2StartTime(null);
    sessionStorage.clear();
  };

  if (phase === "complete") {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "#f5f5f5",
        gap: "24px"
      }}>
        <h1>{language === "ko" ? "실험 완료!" : "Experiment Complete!"}</h1>
        <p>{language === "ko" ? "참여해주셔서 감사합니다." : "Thank you for your participation."}</p>
        <button 
          onClick={handleExperimentRestart}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer"
          }}
        >
          {language === "ko" ? "새 실험 시작" : "Start New Experiment"}
        </button>
      </div>
    );
  }

  if (phase === "survey1" || phase === "survey2") {
    return (
      <SurveyPage 
        systemType={phase === "survey1" ? "system1" : "system2"}
        language={language}
        systemUsageDuration={
          phase === "survey1" 
            ? Date.now() - system1StartTime 
            : Date.now() - system2StartTime
        }
        onComplete={phase === "survey1" ? handleSurvey1Complete : handleSurvey2Complete}
      />
    );
  }

  if (phase === "system1" || phase === "system2") {
    return (
      <AppUI 
        isBaseline={phase === "system1"}
        language={language}
        onSystemComplete={phase === "system1" ? handleSystem1Complete : handleSystem2Complete}
      />
    );
  }

  return (
    <LandingPage onStart={handleLandingComplete} />
  );
}
