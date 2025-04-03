import React, {useEffect} from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ClassBoard from "./Board/ClassBoard";
import InstanceBoard from "./Board/InstanceBoard";
import GhostNode from "./components/GhostNode";
import { DnDProvider } from "./hooks/useDnD";
import { useNodesState, useEdgesState } from "@xyflow/react";
import { classToFlow } from "./utils/flowUtils";
import classSample from "./classSample";
import ClassBoardWithProvider from "./Board/ClassBoard";
import InstanceBoardWithProvider from "./Board/InstanceBoard";

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
      <DnDProvider>
        <div style={{ width: "500px", height: "500px" }}>
          <ClassBoardWithProvider />
        </div>
        <div style={{ width: "500px", height: "500px" }}>
          <InstanceBoardWithProvider />
        </div>
        <GhostNode />
      </DnDProvider>
    </div>
  );
}
