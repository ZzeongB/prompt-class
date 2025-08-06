import { useState } from "react";
import CustomButton from "./components/CustomButton";
import { logEvent } from "./api/logEvent";
import { surveyQuestions, systemLabels } from "./config/surveyQuestions";

export default function SurveyPage({ systemType, language, systemUsageDuration, onComplete }) {
  const [responses, setResponses] = useState({});
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState(language);

  const questions = surveyQuestions[currentLanguage];
  const labels = systemLabels[currentLanguage];

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === "ko" ? "en" : "ko");
  };

  const handleRatingChange = (questionId, rating) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: rating
    }));
  };

  const handleSubmit = async () => {
    const missingQuestions = questions.filter(q => !responses[q.id]);
    
    if (missingQuestions.length > 0) {
      const message = currentLanguage === "ko" 
        ? "모든 질문에 답변해주세요." 
        : "Please answer all questions.";
      alert(message);
      return;
    }

    await logEvent("system_survey_completed", {
      system_type: systemType,
      language: language,
      responses: responses,
      additional_feedback: additionalFeedback,
      completion_time: new Date().toISOString(),
      system_usage_duration: systemUsageDuration
    });

    const message = currentLanguage === "ko"
      ? "설문조사가 완료되었습니다!"
      : "Survey completed!";
    alert(message);
    onComplete();
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
        gap: "24px",
        padding: "40px 20px",
        overflowY: "auto"
      }}
    >
      <div style={{ alignSelf: "center", display: "flex", alignItems: "center", gap: "20px", margin: "0 0 20px 0" }}>
        <h1 style={{ margin: 0 }}>
          {currentLanguage === "ko" ? `${labels[systemType]} 설문조사` : `${labels[systemType]} Survey`}
        </h1>
        <button
          onClick={toggleLanguage}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          {currentLanguage === "ko" ? "English" : "한국어"}
        </button>
      </div>
      
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "24px", 
        width: "100%",
        maxWidth: "700px",
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        alignSelf: "center"
      }}>
        
        {questions.map((question, index) => (
          <div key={question.id}>
            <label style={{ display: "block", marginBottom: "12px", fontWeight: "bold", fontSize: "16px" }}>
              {index + 1}. {question.question}
            </label>
            
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              gap: "20px",
              padding: "0 10px"
            }}>
              <span style={{ fontSize: "12px", color: "#666" }}>
                {question.scale.minLabel}
              </span>
              {Array.from({ length: 7 }, (_, i) => i + 1).map(rating => (
                <label key={rating} style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "4px"
                }}>
                  <input
                    type="radio"
                    name={question.id}
                    value={rating}
                    checked={responses[question.id] === rating}
                    onChange={() => handleRatingChange(question.id, rating)}
                    style={{ marginBottom: "4px", transform: "scale(1.2)" }}
                  />
                  <span style={{ fontSize: "14px", fontWeight: "bold" }}>{rating}</span>
                </label>
              ))}
              <span style={{ fontSize: "12px", color: "#666" }}>
                {question.scale.maxLabel}
              </span>
            </div>
          </div>
        ))}

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "16px" }}>
            {currentLanguage === "ko" 
              ? "추가 의견이나 개선 사항이 있으시다면 자유롭게 작성해주세요." 
              : "Please share any additional feedback or suggestions for improvement."}
          </label>
          <textarea
            value={additionalFeedback}
            onChange={(e) => setAdditionalFeedback(e.target.value)}
            placeholder={currentLanguage === "ko" 
              ? "자유롭게 의견을 작성해주세요..." 
              : "Please share your thoughts..."}
            style={{
              width: "100%",
              height: "100px",
              padding: "8px",
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              resize: "vertical"
            }}
          />
        </div>

        <CustomButton
          color="object"
          onClick={handleSubmit}
          style={{
            alignSelf: "center",
            marginTop: "20px",
            padding: "12px 32px",
            fontSize: "16px"
          }}
        >
          {currentLanguage === "ko" ? "설문조사 제출" : "Submit Survey"}
        </CustomButton>
      </div>
    </div>
  );
}