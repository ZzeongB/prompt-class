import React, { useState, useEffect } from 'react';
import { evaluationQuestions, responseOptions } from '../config/evaluationQuestions';

const EvaluationPanel = ({ promptData, onEvaluationComplete, isBaseline }) => {
  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Reset responses when promptData changes (new scene)
  useEffect(() => {
    if (promptData) {
      setResponses({});
      setCurrentQuestionIndex(0);
    }
  }, [promptData?.id]); // Reset when promptData.id changes

  // Reset responses when system changes (System 1 ↔ System 2)
  useEffect(() => {
    setResponses({});
    setCurrentQuestionIndex(0);
    console.log(`Evaluation responses reset for system: ${isBaseline ? 'System 1 (Baseline)' : 'System 2 (Advanced)'}`);
  }, [isBaseline]); // Reset when isBaseline changes

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getResponseColor = (questionId, optionValue) => {
    const selectedResponse = responses[questionId];
    if (selectedResponse === optionValue) {
      const option = responseOptions.find(opt => opt.value === optionValue);
      return option?.color || '#6b7280';
    }
    return '#f1f5f9';
  };

  const getResponseTextColor = (questionId, optionValue) => {
    return responses[questionId] === optionValue ? '#ffffff' : '#64748b';
  };

  const handleSubmitEvaluation = () => {
    const evaluationData = {
      promptId: promptData.id,
      responses: responses,
      completedAt: new Date().toISOString()
    };
    
    onEvaluationComplete(evaluationData);
  };

  const completedResponses = Object.keys(responses).length;
  const totalQuestions = evaluationQuestions.length;
  const isComplete = completedResponses === totalQuestions;

  if (!promptData) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          color: '#64748b'
        }}
      >
        Please select a prompt to begin evaluation
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        maxHeight: '600px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '8px'
          }}
        >
          Evaluation: {promptData.title}
        </h3>
        
        <div
          style={{
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '12px'
          }}
        >
          Progress: {completedResponses}/{totalQuestions} questions answered
        </div>
        
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#e2e8f0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${(completedResponses / totalQuestions) * 100}%`,
              height: '100%',
              backgroundColor: isComplete ? '#22c55e' : '#3b82f6',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {evaluationQuestions.map((question, index) => (
          <div
            key={question.id}
            style={{
              padding: '16px',
              backgroundColor: responses[question.id] ? '#ffffff' : '#f1f5f9',
              borderRadius: '8px',
              border: responses[question.id] ? '1px solid #22c55e' : '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '4px'
              }}
            >
              Q{index + 1}. {question.question}
            </div>
            
            {/* <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '12px',
                lineHeight: '1.4'
              }}
            >
              {question.description}
            </div> */}
{/*             
            <div
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginBottom: '8px',
                fontWeight: '500'
              }}
            >
              Category: {question.category}
            </div> */}
            
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              {responseOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResponseChange(question.id, option.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: getResponseColor(question.id, option.value),
                    color: getResponseTextColor(question.id, option.value)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isComplete && (
        <div
          style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center'
          }}
        >
          <button
            onClick={handleSubmitEvaluation}
            style={{
              padding: '12px 24px',
              backgroundColor: '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
            }}
          >
            Submit Evaluation
          </button>
        </div>
      )}
    </div>
  );
};

export default EvaluationPanel;