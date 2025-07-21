import React, { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import GhostNode from "./components/nodes/GhostNode";
import BaselineLayoutBoardWithProvider from "./Board/BaselineLayoutBoard";
import ClassBoardWithProvider from "./Board/ClassBoard";
import LayoutBoardWithProvider from "./Board/LayoutBoard";
import { ClassGraphProvider } from "./context/ClassGraphContext";
import { InstanceGraphProvider } from "./context/InstanceGraphContext";
import { ImageProivder } from "./context/ImageContext";
import { DnDProvider } from "./context/DragAndDropContext";
import InstanceTreeBoard from "./Board/InstanceTreeBoard";
import CustomButton from "./components/CustomButton";
import { logEvent } from "./api/logEvent";
import { HelpCircle } from "lucide-react";
import HelpModal from "./components/HelpModal"; // 추가

export default function AppUI({ isBaseline: initialIsBaseline }) {
  const [imageSrc, setImageSrc] = useState("");
  const [isBaseline, setIsBaseline] = useState(initialIsBaseline);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("is_baseline", JSON.stringify(isBaseline));
  }, [isBaseline]);

  const toggleSystem = async () => {
    const newState = !isBaseline;
    setIsBaseline(newState);
    await logEvent("system_switch", {
      new_system: newState ? "system1" : "system2",
    });
  };

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
      <ClassGraphProvider>
        <InstanceGraphProvider>
          <ImageProivder>
            <DnDProvider>
              {isBaseline ? (
                <div
                  style={{
                    width: "20px",
                  }}
                ></div>
              ) : (
                <div
                  style={{
                    width: "600px",
                    height: "600px",
                    flexShrink: 0, // 고정 너비 유지
                    boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
                    marginLeft: "20px",
                    marginTop: "20px",
                    background: "#FEFEFE",
                    borderRadius: "8px",
                  }}
                >
                  <ClassBoardWithProvider />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  height: "600px",
                  width: "800px", // 부모가 알아서 크기 조절
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
                    flexShrink: 0, // 고정 너비 유지
                    marginTop: "12px", // LayoutBoard와의 거리
                    marginLeft: "12px", // LayoutBoard와의 거리
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
                      opacity: 0.2, // 👈 여기! 0.0 (완전 투명) ~ 1.0 (불투명)
                      objectFit: "contain", // ✅ 비율 유지 + 잘리지 않음 (빈 여백 생길 수 있음)
                    }}
                  />
                  <div
                    style={{
                      width: "512px",
                      height: "512px",
                      position: "relative",
                      flexShrink: 0, // 고정 너비 유지
                      background: imageSrc ? "" : "#FEFEFE",
                    }}
                  >
                    {isBaseline ? (
                      <BaselineLayoutBoardWithProvider
                        onImageGenerated={setImageSrc}
                      />
                    ) : (
                      <LayoutBoardWithProvider onImageGenerated={setImageSrc} />
                    )}
                  </div>
                </div>

                <div
                  style={{
                    flexGrow: 1,
                    marginLeft: "10px",
                    overflowY: "auto",
                    background: "#FEFEFE",
                    // padding: "16px 20px",
                    borderRadius: "8px",
                    boxShadow: "-1px 0 4px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    marginTop: "12px", // LayoutBoard와의 거리
                    marginRight: "12px", // LayoutBoard와의 거리
                    marginBottom: "12px", // LayoutBoard와의 거리
                  }}
                >
                  <InstanceTreeBoard />
                </div>
                <CustomButton
                  color="grey"
                  size="sm"
                  onClick={() => setShowHelp(true)}
                  style={{
                    position: "fixed",
                    top: "20px", // System 버튼 위에 위치
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
                  <BaselineLayoutBoardWithProvider
                    onImageGenerated={() => {}}
                  />
                ) : (
                  <LayoutBoardWithProvider onImageGenerated={() => {}} />
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
              <GhostNode />
            </DnDProvider>
          </ImageProivder>
        </InstanceGraphProvider>
      </ClassGraphProvider>
    </div>
  );
}
