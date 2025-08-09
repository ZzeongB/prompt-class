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
  const [systemOrder, setSystemOrder] = useState(() => {
    const stored = sessionStorage.getItem("system_order");
    return stored || "system1_first";
  });
  const [system1StartTime, setSystem1StartTime] = useState(null);
  const [system2StartTime, setSystem2StartTime] = useState(null);

  useEffect(() => {
    sessionStorage.setItem("experiment_phase", phase);
  }, [phase]);

  useEffect(() => {
    sessionStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    sessionStorage.setItem("system_order", systemOrder);
  }, [systemOrder]);

  const handleLandingComplete = (selectedLanguage, selectedSystemOrder) => {
    setLanguage(selectedLanguage);
    setSystemOrder(selectedSystemOrder);
    
    if (selectedSystemOrder === "direct_system1") {
      setPhase("system1");
      setSystem1StartTime(Date.now());
    } else if (selectedSystemOrder === "direct_system2") {
      setPhase("system2");
      setSystem2StartTime(Date.now());
    } else if (selectedSystemOrder === "system1_first") {
      setPhase("system1");
      setSystem1StartTime(Date.now());
    } else {
      setPhase("system2");
      setSystem2StartTime(Date.now());
    }
  };

  const handleSystem1Complete = () => {
    if (systemOrder === "system1_first") {
      setPhase("survey1");
    } else {
      setPhase("survey2");
    }
  };

  const handleSurvey1Complete = () => {
    if (systemOrder === "system1_first") {
      setPhase("system2");
      setSystem2StartTime(Date.now());
    } else {
      setPhase("system1");
      setSystem1StartTime(Date.now());
    }
  };

  const handleSystem2Complete = () => {
    if (systemOrder === "system2_first") {
      setPhase("survey1");
    } else {
      setPhase("survey2");
    }
  };

  const handleSurvey2Complete = () => {
    setPhase("complete");
  };

  const handleExperimentRestart = () => {
    setPhase("landing");
    setSystemOrder("system1_first");
    setSystem1StartTime(null);
    setSystem2StartTime(null);
    sessionStorage.clear();
  };

  const handleReturnHome = () => {
    setPhase("landing");
    // Keep the session data but return to landing page
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
    const getSystemTypeForSurvey = () => {
      if (systemOrder === "system1_first") {
        return phase === "survey1" ? "system1" : "system2";
      } else {
        return phase === "survey1" ? "system2" : "system1";
      }
    };

    const getSystemDuration = () => {
      const systemType = getSystemTypeForSurvey();
      return systemType === "system1" 
        ? Date.now() - system1StartTime 
        : Date.now() - system2StartTime;
    };

    return (
      <SurveyPage 
        systemType={getSystemTypeForSurvey()}
        language={language}
        systemUsageDuration={getSystemDuration()}
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
        onReturnHome={handleReturnHome}
      />
    );
  }

  return (
    <LandingPage onStart={handleLandingComplete} />
  );
}
