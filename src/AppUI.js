import React, { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import BaselineLayoutBoardWithProvider from "./Board/BaselineLayoutBoard";
import LayoutBoardWithProvider from "./Board/LayoutBoard";
import { ClassProvider } from "./context/ClassContext";
// import InstanceTreeBoard from "./Board/InstanceTreeBoard";
import { ClassTreeBoard } from "./Board/ClassTreeBoard";
import CustomButton from "./components/CustomButton";
import { logEvent } from "./api/logEvent";
import { HelpCircle } from "lucide-react";
import HelpModal from "./components/modal/HelpModal"; // 추가
import InstanceBoard from "./Board/InstanceBoard";
import { convertImageToBase64 } from "./utils/imageUtils";

export default function AppUI({ isBaseline, language, onSystemComplete, onReturnHome, isTutorial=false }) {
  const [imageSrc, setImageSrc] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [newInstanceToAdd, setNewInstanceToAdd] = useState(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [isClassLibraryExpanded, setIsClassLibraryExpanded] = useState(false);
  const onInstanceSelect = (instanceId) => {
    setSelectedInstanceId(instanceId);
  };

  // useEffect(() => {
  //   // set Image source to "/assets/base-images/rabbit.png" image
  //   // load in base64 format
  //   const loadInitialImage = async () => {
  //     const imagePath = `/assets/base-images/rabbits.png`;
  //     const base64Image = await convertImageToBase64(imagePath);
  //     setImageSrc(base64Image);
  //   };
  //   loadInitialImage();
  // }, []);

  useEffect(() => {
    const errorHandler = (e) => {
      if (
        e.message.includes(
          "ResizeObserver loop completed with undelivered notifications" ||
          "ResizeObserver loop limit exceeded"
        )
      ) {
        const resizeObserverErr = document.getElementById(
          "webpack-dev-server-client-overlay"
        );
        if (resizeObserverErr) {
          resizeObserverErr.style.display = "none";
        }
      }
    };
    window.addEventListener("error", errorHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
    };
  }, []);

  const handleSystemComplete = async () => {
    await logEvent("system_completed", {
      system: isBaseline ? "system1" : "system2",
      completion_time: new Date().toISOString()
    });
    onSystemComplete();
  };

  const handleReturnHome = async () => {
    await logEvent("return_home", {
      system: isBaseline ? "system1" : "system2",
      return_time: new Date().toISOString()
    });
    onReturnHome && onReturnHome();
  };

  const handleAddInstance = (instanceData) => {
    setNewInstanceToAdd(instanceData);
  };

  const handleInstanceAdded = () => {
    setNewInstanceToAdd(null); // 처리 완료 후 초기화
  };

  const handleClassLibraryExpandChange = (isExpanded) => {
    setIsClassLibraryExpanded(isExpanded);
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
          <div
            style={{
              width: "20px",
            }}
          ></div>

          <div
            style={{
              display: "flex",
              height: "600px",
              width: isBaseline ? "542px" : "1500px",
              boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
              position: "relative",
              marginRight: "20px",
              marginTop: "20px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                width: "512px",
                height: "512px",
                position: "relative",
                border: "1px solid #eee",
                flexShrink: 0,
                marginTop: "12px",
                marginLeft: "12px",
              }}
            >
              <img
                src={imageSrc}
                alt="No Image"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 0,
                  opacity: 0.2,
                  objectFit: "contain",
                }}
              />
              <div
                style={{
                  width: "512px",
                  height: "512px",
                  position: "relative",
                  flexShrink: 0,
                  background: imageSrc ? "" : "#FEFEFE",
                }}
              >
                {isBaseline ? (
                  <BaselineLayoutBoardWithProvider
                    onImageGenerated={setImageSrc}
                    isTutorial={isTutorial}
                  />
                ) : (
                  <LayoutBoardWithProvider
                    onImageGenerated={setImageSrc}
                    newInstanceToAdd={newInstanceToAdd}
                    onInstanceAdded={handleInstanceAdded}
                    onNodeSelect={onInstanceSelect}
                    isTutorial={isTutorial}
                    selectedInstanceId={selectedInstanceId}
                  />
                )}
              </div>
            </div>
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
                  // height: "576px"
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    marginRight: isClassLibraryExpanded ? "300px" : "40px",
                    transition: "margin-right 0.3s ease-in-out",
                  }}
                >
                  <InstanceBoard
                    selectedInstanceId={selectedInstanceId}
                    onInstanceSelect={onInstanceSelect}
                  />
                </div>

                <ClassTreeBoard
                  onAddInstance={handleAddInstance}
                  onExpandChange={handleClassLibraryExpandChange}
                />
              </div>)}

            <CustomButton
              color="grey"
              size="sm"
              onClick={() => setShowHelp(true)}
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                zIndex: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                padding: 0,
                borderRadius: "50%",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
              title="도움말 보기"
            >
              <HelpCircle size={20} />
            </CustomButton> 
          </div>

          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

          <div style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            gap: "5px"
          }}>
            <CustomButton
              color="neutral"
              size="sm"
              onClick={handleReturnHome}
             
            >
              {language === "ko" ? "홈으로" : "Home"}
            </CustomButton>
            
            <CustomButton
              color="object"
              size="sm"
              onClick={handleSystemComplete}
            >
              {language === "ko" 
                ? `${isBaseline ? "시스템 1" : "시스템 2"} 완료` 
                : `Complete ${isBaseline ? "System 1" : "System 2"}`}
            </CustomButton>
          </div> 
      </ClassProvider>
    </div>
  );
}
