import React from "react";
import { Handle, Position, useConnection } from "@xyflow/react";
import { useDnD } from "../context/DragAndDropContext";
import {
  getClassNodeStyle,
  getInstanceNodeStyle,
} from "../utils/node/nodeStyleUtils";

export default function BaseNode({ id, data, nodeType }) {
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;
  const label = data.hasValue ? data.hasValue : data.label;
  const [, setId, , setType, , setPosition, , setLabel, , setDragSource] =
    useDnD();
  const style =
    nodeType === "class"
      ? getClassNodeStyle(data.type, data)
      : getInstanceNodeStyle(data.type, data);

  const onDragStart = (e) => {
    if (e.target.closest(".drag-handle") || e.target.closest(".classHandle"))
      return;

    setType(data.type);
    setLabel(data.label);
    setId(id);
    setDragSource(nodeType);

    const onMouseMove = (e) => setPosition({ x: e.clientX, y: e.clientY });

    const onMouseUp = () => {
      setType(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div style={{ ...style, position: "relative" }}>
      <div
        className="drag-handle"
        style={{
          cursor: "move",
          position: "absolute",
          top: "10px",
          left: "-10px",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "0 3px 0 3px",
          zIndex: 10,
        }}
      >
        ⠿
      </div>
      {/* <NodeToolbar isVisible={"enabled"}>
          {{data.type !== "attribute" && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (data.type === "object") {
                handleObjectLayoutSave(id, getNode, setNodes, addEdges);
              } else if (data.type === "relationship") {
                handleRelationshipLayoutSave(id, data, getNode, setNodes);
              }
            }}
          >
            Save layout
          </button>
        )}

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => deleteElements({ nodes: [{ id }] })}
        >
          Delete node
        </button> }
        </NodeToolbar> */}
      <div
        className="nodrag"
        style={{ width: "100%", height: "100%" }}
        onMouseDown={onDragStart}
      >
        {label}

        {!connection.inProgress && (
          <Handle
            className="classHandle"
            position={Position.Right}
            type="source"
          />
        )}
        {(!connection.inProgress || isTarget) && (
          <Handle
            className="classHandle"
            position={Position.Right}
            type="target"
            isConnectableStart={false}
          />
        )}
      </div>
    </div>
  );
}
