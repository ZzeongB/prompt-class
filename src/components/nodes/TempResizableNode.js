import React, { memo, useState, useEffect, useRef } from "react";
import {
  NodeResizer,
  NodeToolbar,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { EDGE_COLOR } from "../../utils/constants";
import { generateDescription } from "../../api/generateDescription";
import { useImage } from "../../context/ImageContext";
import { getNormalizedBox } from "../../utils/node/getNormalizedBox";
import HoverButton from "../nodeComponents/HoverButton";
import { Eraser, Trash2, Network } from "lucide-react";

function TempResizableNode({ id, data, width, height }) {
  const { deleteElements, getNode, flowToScreenPosition, setNodes } = useReactFlow();
  const node = getNode(id);
  const [isSelected, setIsSelected] = useState(true);
  const nodeRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        nodeRef.current &&
        !nodeRef.current.contains(event.target) &&
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target)
      ) {
        setIsSelected(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside, true);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside, true);
  }, []);

  const crop_box = getNormalizedBox(node, flowToScreenPosition, 500, 0, false);

  const handleEraseFromImage = () => {
    // Make Object Node with label "empty, background"
    const emptyNode = {
      id: `empty-${id}`,
      type: "instance",
      position: { x: node.position.x, y: node.position.y },
      data: {
        label: "empty",
        type: "empty",
        sharedId: id,
      },
    };

    // Add the empty node to the graph
    setNodes((prev) => [...prev, emptyNode]);
  }

  const { image, globalCaption } = useImage();
  return (
    <div
      ref={nodeRef}
      onMouseDown={(e) => {
        e.stopPropagation(); // ✅ prevents parent from hijacking the drag
        e.preventDefault(); // ✅ optional but helps prevent text selection, etc.
      }}
      onClick={(e) => {
        setIsSelected(true);
        e.stopPropagation(); // ✅ prevents parent from hijacking the drag
        e.preventDefault(); // ✅ optional but helps prevent text selection, etc.
      }}
    >
      <NodeToolbar
        isVisible={isSelected}
        position={Position.Top}
        style={{
          display: "flex",
          alignItems: "center",
          // padding: "6px 10px",
          backgroundColor: "#2B2B2B",
          borderRadius: "10px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(4px)",
          top: "10px"
        }}
        ref={toolbarRef}
      >
        <HoverButton
          title="Generate graph from image"
          icon={<Network size={16} />}
          onClick={() => {
            generateDescription(image, crop_box, globalCaption);
          }}
        />
        <HoverButton
          title="Remove from image"
          icon={<Eraser size={16} />}
          onClick={handleEraseFromImage}
        />
        <HoverButton
          title="Delete node"
          icon={<Trash2 size={16} />}
          danger
          onClick={() => deleteElements({ nodes: [{ id }] })}
        />
      </NodeToolbar>

      <NodeResizer color={EDGE_COLOR} minWidth={30} minHeight={30} />
      <div style={{ visibility: "hidden", height: "1em" }}>{data.label}</div>
    </div>
  );
}

export default memo(TempResizableNode);
