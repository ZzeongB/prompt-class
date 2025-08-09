import { useState } from "react";
import CustomButton from "./components/CustomButton";
import { logEvent } from "./api/logEvent";
import { surveyQuestions, systemLabels, sectionTitles } from "./config/surveyQuestions";

export default function SurveyPage({ systemType, language, systemUsageDuration, onComplete }) {
  const [responses, setResponses] = useState({});
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [currentSection, setCurrentSection] = useState(1);

  const surveyData = surveyQuestions[currentLanguage];
  const labels = systemLabels[currentLanguage];
  const sections = sectionTitles[currentLanguage];

  const allQuestions = [
    ...surveyData.section1.questions,
    ...surveyData.section2.questions, 
    ...surveyData.section3.questions
  ];

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === "ko" ? "en" : "ko");
  };

  const handleRatingChange = (questionId, rating) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: rating
    }));
  };

  const getCurrentSectionQuestions = () => {
    if (currentSection === 1) return surveyData.section1.questions;
    if (currentSection === 2) return surveyData.section2.questions;
    return surveyData.section3.questions;
  };

  const handleNextSection = () => {
    const currentQuestions = getCurrentSectionQuestions();
    const missingQuestions = currentQuestions.filter(q => !responses[q.id]);
    
    if (missingQuestions.length > 0) {
      const message = currentLanguage === "ko" 
        ? "현재 섹션의 모든 질문에 답변해주세요." 
        : "Please answer all questions in the current section.";
      alert(message);
      return;
    }

    setCurrentSection(prev => prev + 1);
  };

  const handlePrevSection = () => {
    setCurrentSection(prev => prev - 1);
  };

  const handleSubmit = async () => {
    const missingQuestions = allQuestions.filter(q => !responses[q.id]);
    
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
        gap: "10px",
        // padding: "20px 20px",
        overflowY: "auto"
      }}
    >
      {/* Progress indicator */}
      {/* <div style={{ alignSelf: "center", display: "flex", alignItems: "center", gap: "10px", marginBottom: "0px" }}>
        {[1, 2, 3].map(section => (
          <div key={section} style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: currentSection === section ? "#007bff" : currentSection > section ? "#28a745" : "#e9ecef",
            color: currentSection === section || currentSection > section ? "white" : "#6c757d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px"
          }}>
            {section}
          </div>
        ))}
      </div> */}
      
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "0px", 
        width: "100%",
        maxWidth: "750px",
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        alignSelf: "center",
        border: "1px solid #e8ecef"
      }}>
        
        {/* Section Header */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: "15px" 
        }}>
          <h2 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "20px", 
            fontWeight: "600", 
            color: "#2c3e50",
            letterSpacing: "0.5px"
          }}>
            {currentSection === 1 ? sections.section1 : 
             currentSection === 2 ? sections.section2 : 
             sections.section3}
          </h2>
          <div style={{
            fontSize: "10px",
            color: "#7f8c8d",
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            {`Section ${currentSection} / 3`}
          </div>
        </div>
        
        {getCurrentSectionQuestions().map((question, index) => (
          <div key={question.id} style={{
            marginBottom: "25px"
          }}>
            <div style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontSize: "15px",
              fontWeight: "600",
              color: "#34495e",
              lineHeight: "1.4"
            }}>
              {index + 1}. {question.question}
              <div style={{ 
                fontSize: "11px", 
                color: "#7f8c8d", 
                fontStyle: "normal", 
                marginBottom: "12px",
                paddingLeft: "18px",
                lineHeight: "1.3",
                fontWeight: "400"
              }}>
                {question.questionTranslation}
              </div>
            </div>
            
            
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              gap: "14px",
              padding: "0 5px"
            }}>
              <span style={{ 
                fontSize: "10px", 
                color: "#95a5a6", 
                fontWeight: "500",
                textAlign: "center",
                width: "55px",
                lineHeight: "1.2"
              }}>
                {question.scale.minLabel}
              </span>
              {Array.from({ length: 7 }, (_, i) => i + 1).map(rating => (
                <label key={rating} style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "3px"
                }}>
                  <input
                    type="radio"
                    name={question.id}
                    value={rating}
                    checked={responses[question.id] === rating}
                    onChange={() => handleRatingChange(question.id, rating)}
                    style={{ 
                      marginBottom: "4px", 
                      transform: "scale(1.2)"
                    }}
                  />
                  <span style={{ 
                    fontSize: "9px", 
                color: "#95a5a6", 
                  }}>
                    {rating}
                  </span>
                </label>
              ))}
              <span style={{ 
                fontSize: "11px", 
                color: "#95a5a6", 
                fontWeight: "500",
                textAlign: "center",
                width: "55px",
                lineHeight: "1.2"
              }}>
                {question.scale.maxLabel}
              </span>
            </div>
          </div>
        ))}

        {/* Additional feedback - only on last section */}
        {currentSection === 3 && (
          <div style={{
          }}>
            <label style={{ 
              display: "block", 
              marginBottom: "5px", 
              fontWeight: "600", 
              fontSize: "13px",
              color: "#2c3e50",
              lineHeight: "1.4"
            }}>
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
                width: "98%",
                padding: "5px",
                fontSize: "11x",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: "1.5",
                backgroundColor: "white",
                transition: "border-color 0.2s ease",
                outline: "none",
                border: "1px solid #dfe6e9", 
                borderRadius: "6px",
              }}
            />
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginTop: "-5px",
        }}>
          {currentSection > 1 && (
            <CustomButton
              color="neutral"
              onClick={handlePrevSection}
              style={{
                fontSize: "11px"
              }}
            >
              {currentLanguage === "ko" ? "이전" : "Previous"}
            </CustomButton>
          )}
          
          <div style={{ flex: 1 }}></div>
          
          {currentSection < 3 ? (
            <CustomButton
              color="object"
              onClick={handleNextSection}
              style={{
                fontSize: "11px"
              }}
            >
              {currentLanguage === "ko" ? "다음" : "Next"}
            </CustomButton>
          ) : (
            <CustomButton
              color="object"
              onClick={handleSubmit}
              style={{
                fontSize: "11px"
              }}
            >
              {currentLanguage === "ko" ? "설문조사 제출" : "Submit Survey"}
            </CustomButton>
          )}
        </div>
      </div>
    </div>
  );
}