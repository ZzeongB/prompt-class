import React, { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import GhostNode from "./components/GhostNode";
import ClassBoardWithProvider from "./Board/ClassBoard";
import InstanceBoardWithProvider from "./Board/InstanceBoard";
import LayoutBoardWithProvider from "./Board/LayoutBoard";
import ImageBoard from "./Board/ImageBoard";
import { ClassGraphProvider } from "./context/ClassGraphContext";
import { InstanceGraphProvider } from "./context/InstanceGraphContext";
import { ImageProivder } from "./context/ImageContext";
import { DnDProvider } from "./context/DragAndDropContext";

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
    <div style={{ display: "flex" }}>
      <ClassGraphProvider>
        <InstanceGraphProvider>
          <ImageProivder>
            <DnDProvider>
              {/* <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            > */}
              <div style={{ width: "500px", height: "600px" }}>
                <ClassBoardWithProvider />
              </div>
              <div
                style={{
                  position: "relative",
                  width: "512px",
                  height: "512px",
                  border: "1px solid #333",
                }}
              >
                <img
                  src={imageSrc}
                  alt="Generated"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: -9999,
                    opacity: 0.2, // 👈 여기! 0.0 (완전 투명) ~ 1.0 (불투명)
                    objectFit: "contain", // ✅ 비율 유지 + 잘리지 않음 (빈 여백 생길 수 있음)
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    width: "100%",
                    height: "100%",
                    userSelect: "none", // ✅ 이거!
                  }}
                >
                  <LayoutBoardWithProvider onImageGenerated={setImageSrc} />
                </div>
              </div>
              <div style={{ width: "500px", height: "600px" }}>
                <InstanceBoardWithProvider />
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
