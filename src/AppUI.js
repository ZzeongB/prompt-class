import React, { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import BaselineLayoutBoardWithProvider from "./Board/BaselineLayoutBoard";
import LayoutBoardWithProvider from "./Board/LayoutBoard";
import { ImageProivder } from "./context/ImageContext";
import { ClassProvider } from "./context/ClassContext";
// import InstanceTreeBoard from "./Board/InstanceTreeBoard";
import { ClassTreeBoard } from "./Board/ClassTreeBoard";
import CustomButton from "./components/CustomButton";
import { logEvent } from "./api/logEvent";
import { HelpCircle } from "lucide-react";
import HelpModal from "./components/modal/HelpModal"; // 추가
import InstanceBoard from "./Board/InstanceBoard";

export default function AppUI({ isBaseline: initialIsBaseline }) {
  const [imageSrc, setImageSrc] = useState("");
  const [isBaseline, setIsBaseline] = useState(initialIsBaseline);
  const [showHelp, setShowHelp] = useState(false);
  const [newInstanceToAdd, setNewInstanceToAdd] = useState(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const onInstanceSelect = () => {
    console.log("onInstanceSelect");
  };

  useEffect(() => {
    sessionStorage.setItem("is_baseline", JSON.stringify(isBaseline));
  }, [isBaseline]);

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

  const toggleSystem = async () => {
    const newState = !isBaseline;
    setIsBaseline(newState);
    await logEvent("system_switch", {
      new_system: newState ? "system1" : "system2",
    });
  };

  const handleAddInstance = (instanceData) => {
    setNewInstanceToAdd(instanceData);
  };

  const handleInstanceAdded = () => {
    setNewInstanceToAdd(null); // 처리 완료 후 초기화
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
        <ImageProivder>
          <div
            style={{
              width: "20px",
            }}
          ></div>

          <div
            style={{
              display: "flex",
              height: "600px",
              width: "1500px",
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
                  />
                ) : (
                  <LayoutBoardWithProvider
                    onImageGenerated={setImageSrc}
                    newInstanceToAdd={newInstanceToAdd}
                    onInstanceAdded={handleInstanceAdded}
                    setSelectedInstanceId={setSelectedInstanceId}
                  />
                )}
              </div>
            </div>
            <div
              style={{
                flexGrow: 1,
                marginLeft: "10px",
                overflowY: "auto",
                background: "#FEFEFE",
                borderRadius: "8px",
                boxShadow: "-1px 0 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "12px",
                marginRight: "12px",
                marginBottom: "12px",
                width: "400px",
              }}
            >
              <InstanceBoard
                selectedInstanceId={selectedInstanceId}
                onInstanceSelect={onInstanceSelect}
              />
            </div>
            <div
              style={{
                flexGrow: 1,
                marginLeft: "10px",
                overflowY: "auto",
                background: "#FEFEFE",
                borderRadius: "8px",
                boxShadow: "-1px 0 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "12px",
                marginRight: "12px",
                marginBottom: "12px",
                width: "400px",
              }}
            >
              <ClassTreeBoard onAddInstance={handleAddInstance} />
            </div>

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

          <>
            {isBaseline ? (
              <BaselineLayoutBoardWithProvider onImageGenerated={() => {}} />
            ) : (
              <LayoutBoardWithProvider
                onImageGenerated={() => {}}
                newInstanceToAdd={null}
                onInstanceAdded={() => {}}
              />
            )}

            <CustomButton
              color="grey"
              size="sm"
              onClick={toggleSystem}
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 999,
              }}
            >
              {isBaseline ? "→ Switch to System 2" : "→ Switch to System 1"}
            </CustomButton>
          </>
        </ImageProivder>
      </ClassProvider>
    </div>
  );
}
