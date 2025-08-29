import React, { useState, useEffect } from 'react';
import EvaluationLayoutBoard from './Board/EvaluationLayoutBoard';
import InstanceBoard from './Board/InstanceBoard';
import EvaluationPanel from './components/EvaluationPanel';
import CustomButton from './components/CustomButton';
import { ArrowLeft } from 'lucide-react';
import { ClassProvider } from './context/ClassContext';
import promptData from './data/promptData.json';
import { logEvent } from './api/logEvent';

const EvaluationPage = ({ onReturnHome, onSystemComplete, isBaseline = false, language = "ko" }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState([]); // Store all evaluations from both systems
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [allScenesCompleted, setAllScenesCompleted] = useState(false);
  
  const completedEvaluations = evaluations.length;

  const totalPrompts = 1;

  // Reset progress when system changes
  useEffect(() => {
    console.log(`Starting ${isBaseline ? 'System 1 (Baseline)' : 'System 2 (Advanced)'}`);
    setCurrentSceneIndex(0);
    setEvaluations([]); // Reset current system evaluations
    setAllScenesCompleted(false);
    setSelectedInstanceId(null);
  }, [isBaseline]);

  // Auto-load scene data when scene index changes
  useEffect(() => {
    if (currentSceneIndex < totalPrompts) {
      const sceneId = currentSceneIndex + 1;
      const sceneData = promptData.find(p => p.id === sceneId);
      if (sceneData) {
        setSelectedPrompt(sceneData);
        setSelectedInstanceId(null); // Reset selection when loading new scene
      }
    }
  }, [currentSceneIndex]);

  const handleSceneLoad = (sceneData) => {
    // This will be called by EvaluationLayoutBoard when scene is actually loaded
    setSelectedPrompt(sceneData);
    setSelectedInstanceId(null);
  };

  const handleInstanceSelect = (instanceId) => {
    setSelectedInstanceId(instanceId);
  };

  const handleEvaluationComplete = (evaluationData) => {
    const newEvaluations = [...evaluations, evaluationData];
    setEvaluations(newEvaluations);
    
    // Add system information to evaluation data
    const evaluationWithSystem = {
      ...evaluationData,
      systemType: isBaseline ? 'system1' : 'system2',
      systemName: isBaseline ? 'Baseline' : 'Advanced'
    };
    
    // Add to all evaluations (cumulative across systems)
    setAllEvaluations(prev => [...prev, evaluationWithSystem]);
    
    // Log individual scene completion
    logEvent('scene_evaluation_completed', {
      sceneId: evaluationData.promptId,
      systemType: evaluationWithSystem.systemType,
      systemName: evaluationWithSystem.systemName,
      responses: evaluationData.responses,
      completedAt: new Date().toISOString(),
      sceneNumber: currentSceneIndex + 1,
      totalScenes: totalPrompts
    });
    
    // Log the evaluation data
    console.log('Evaluation completed:', evaluationWithSystem);
    
    const nextSceneIndex = currentSceneIndex + 1;
    console.log(`Current scene: ${currentSceneIndex + 1}, Next scene: ${nextSceneIndex}, Total: ${totalPrompts}`);
    
    if (nextSceneIndex >= totalPrompts) {
      // Completed all scenes in current system - show button to move to next system
      console.log('All scenes completed! Show move to next system button...');
      setAllScenesCompleted(true);
      
      // Show completion message
      setTimeout(() => {
        alert(`${isBaseline ? 'System 1' : 'System 2'} evaluation completed! Click "Move to ${isBaseline ? 'System 2' : 'Complete'}" to continue.`);
      }, 500);
    } else {
      // Move to next scene
      console.log(`Moving to scene ${nextSceneIndex + 1}`);
      setCurrentSceneIndex(nextSceneIndex);
      
      // Show brief confirmation and auto-advance
      setTimeout(() => {
        alert(`Scene ${currentSceneIndex + 1} evaluation completed! Moving to Scene ${nextSceneIndex + 1}.`);
      }, 200);
    }
  };

  const handleMoveToNextSystem = () => {
    console.log('Manually moving to next system...');
    
    // Log system completion with all evaluations for this system
    const currentSystemEvaluations = allEvaluations.filter(e => 
      e.systemType === (isBaseline ? 'system1' : 'system2')
    );
    
    logEvent('system_evaluation_completed', {
      systemType: isBaseline ? 'system1' : 'system2',
      systemName: isBaseline ? 'Baseline' : 'Advanced',
      userId: sessionStorage.getItem("user_id"),
      totalScenesCompleted: currentSystemEvaluations.length,
      expectedScenes: totalPrompts,
      completedAt: new Date().toISOString(),
      systemEvaluations: currentSystemEvaluations,
      // Summary statistics
      evaluationSummary: {
        totalQuestions: currentSystemEvaluations.length * 10, // 10 questions per scene
        yesResponses: currentSystemEvaluations.reduce((sum, evaluation) => 
          sum + Object.values(evaluation.responses).filter(r => r === 'yes').length, 0),
        noResponses: currentSystemEvaluations.reduce((sum, evaluation) => 
          sum + Object.values(evaluation.responses).filter(r => r === 'no').length, 0),
        unknownResponses: currentSystemEvaluations.reduce((sum, evaluation) => 
          sum + Object.values(evaluation.responses).filter(r => r === 'unknown').length, 0)
      }
    });
    
    // If this is System 2 completion, auto-save the results
    if (!isBaseline) {
      autoSaveResults();
    }
    
    onSystemComplete();
  };

  const autoSaveResults = () => {
    try {
      const allResults = {
        userId: sessionStorage.getItem("user_id"),
        completedAt: new Date().toISOString(),
        evaluations: allEvaluations, // Use all evaluations from both systems
        totalScenes: allEvaluations.length,
        system1Evaluations: allEvaluations.filter(e => e.systemType === 'system1').length,
        system2Evaluations: allEvaluations.filter(e => e.systemType === 'system2').length,
        systems: "both_systems_completed"
      };

      // Method 1: Auto-download as JSON file
      const dataStr = JSON.stringify(allResults, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluation_results_${allResults.userId}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      // Method 2: Save to localStorage as backup
      localStorage.setItem('evaluation_results', JSON.stringify(allResults));
      
      // Method 3: Send to backend via logEvent
      logEvent('evaluation_completed_auto_save', allResults);
      
      console.log('Evaluation results auto-saved:', allResults);
      
      // Show confirmation
      setTimeout(() => {
        alert('Evaluation results have been automatically saved!');
      }, 100);
      
    } catch (error) {
      console.error('Failed to auto-save results:', error);
      alert('Failed to save results automatically. Please use the download button if available.');
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        padding: "10px",
        gap: "20px",
      }}
    >
      <ClassProvider>
        <div style={{ width: "20px" }}></div>

        {/* Main layout - same as AppUI */}
        <div
          style={{
            display: "flex",
            height: "600px",
            width: isBaseline ? "542px" : "1500px", // Narrower for System 1, wider for System 2
            boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
            position: "relative",
            marginRight: "20px",
            marginTop: "20px",
            borderRadius: "8px",
          }}
        >
          {/* Left side - Layout Board */}
          <div
            style={{
              width: "512px",
              height: "512px",
              position: "relative",
              border: "1px solid #eee",
              flexShrink: 0,
              marginTop: "12px",
              marginLeft: "12px",
              backgroundColor: "#FEFEFE",
            }}
          >
            <EvaluationLayoutBoard
              currentSceneId={currentSceneIndex + 1}
              selectedInstanceId={selectedInstanceId}
              isBaseline={isBaseline}
              onInstanceSelect={handleInstanceSelect}
              onSceneLoad={handleSceneLoad}
              allScenesCompleted={allScenesCompleted}
              onMoveToNextSystem={handleMoveToNextSystem}
              systemLabel={isBaseline ? "Move to System 2" : "Complete Evaluation"}
            />
          </div>

          {/* Right side - Instance Board (only show in System 2) */}
          {!isBaseline && (
            <div
              style={{
                flexGrow: 1,
                marginLeft: "10px",
                overflowY: "auto",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                boxShadow: "-1px 0 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "12px",
                marginRight: "12px",
                marginBottom: "12px",
                width: "400px",
                position: "relative",
              }}
            >
              <InstanceBoard
                selectedInstanceId={selectedInstanceId}
                onInstanceSelect={handleInstanceSelect}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Evaluation Questions with Progress */}
        <div
          style={{
            width: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {/* Progress indicator */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              {isBaseline ? "System 1" : "System 2"} Evaluation Progress
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "12px",
              }}
            >
              Scene {currentSceneIndex + 1} of {totalPrompts}
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#e2e8f0",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(completedEvaluations / totalPrompts) * 100}%`,
                  height: "100%",
                  backgroundColor: completedEvaluations === totalPrompts ? "#22c55e" : "#3b82f6",
                  transition: "all 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Evaluation Panel */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              minHeight: "500px",
              flex: 1,
            }}
          >
            <EvaluationPanel
              promptData={selectedPrompt}
              onEvaluationComplete={handleEvaluationComplete}
              isBaseline={isBaseline}
            />
          </div>
        </div>
      </ClassProvider>

      {/* Navigation Buttons */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <CustomButton
          color="neutral"
          size="sm"
          onClick={onReturnHome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ArrowLeft size={16} />
          {language === "ko" ? "홈으로" : "Home"}
        </CustomButton>
        
        {completedEvaluations === totalPrompts && (
          <CustomButton
            color="object"
            size="sm"
            onClick={() => {
              // You can implement export/save functionality here
              const dataStr = JSON.stringify(evaluations, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'evaluation_results.json';
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            {language === "ko" ? "결과 다운로드" : "Download Results"}
          </CustomButton>
        )}
      </div>

    </div>
  );
};

export default EvaluationPage;