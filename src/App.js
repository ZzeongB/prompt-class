import React, { useEffect } from "react";
import "@xyflow/react/dist/style.css";
import GhostNode from "./components/GhostNode";
import ClassBoardWithProvider from "./Board/ClassBoard";
import InstanceBoardWithProvider from "./Board/InstanceBoard";
import { ClassGraphProvider } from "./context/ClassGraphContext";
import { DnDProvider } from "./context/DragAndDropContext";

export default function App() {
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
      <DnDProvider>
        <div style={{ width: "500px", height: "500px" }}>
          <ClassBoardWithProvider />
        </div>
        <div style={{ width: "500px", height: "500px", border: "1px solid #333" }}>
          <InstanceBoardWithProvider />
        </div>
        <GhostNode />
      </DnDProvider>
      </ClassGraphProvider>
    </div>
  );
}
