import React, { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import GhostNode from "./components/nodes/GhostNode";
import BaselineBoardWithProvider from "./Board/BaselineBoard";
import ClassBoardWithProvider from "./Board/ClassBoard";
import InstanceBoardWithProvider from "./Board/InstanceBoard";
import LayoutBoardWithProvider from "./Board/LayoutBoard";
import ImageBoard from "./Board/ImageBoard";
import { ClassGraphProvider } from "./context/ClassGraphContext";
import { InstanceGraphProvider } from "./context/InstanceGraphContext";
import { ImageProivder } from "./context/ImageContext";
import { DnDProvider } from "./context/DragAndDropContext";
import InstanceTreeBoard from "./Board/InstanceTreeBoard";

export default function App() {
  const [imageSrc, setImageSrc] = useState("");

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
              <div
                style={{
                  width: "600px",
                  height: "600px",
                  boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
                  marginLeft: "20px",
                  // marginRight: "20px",
                  marginTop: "20px",
                  background: "#FEFEFE",
                  borderRadius: "8px",
                }}
              >
                <ClassBoardWithProvider />
                {/* <BaselineBoardWithProvider /> */}
              </div>
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
                    <LayoutBoardWithProvider onImageGenerated={setImageSrc} />
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
                  {/* <InstanceBoardWithProvider /> */}
                  <InstanceTreeBoard />
                </div>
              </div>
              {/* </div> */}

              {/* <div
              style={{
                width: "512px",
                height: "512px",
                border: "1px solid #777",
              }}
            >
              <ImageBoard imageSrc={imageSrc} />
            </div> */}
              <GhostNode />
            </DnDProvider>
          </ImageProivder>
        </InstanceGraphProvider>
      </ClassGraphProvider>
    </div>
  );
}
