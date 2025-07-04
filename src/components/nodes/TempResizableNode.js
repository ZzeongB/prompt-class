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
import { generateTextToGraph } from "../../api/generateTextToGraph";
import { useInstanceGraph } from "../../context/InstanceGraphContext";
import { useClassGraph } from "../../context/ClassGraphContext";

function TempResizableNode({ id, data, width, height }) {
  const { deleteElements, getNode, flowToScreenPosition, setNodes, setEdges } =
    useReactFlow();
  const { setInstanceNodes, setInstanceEdges } = useInstanceGraph();
  const { setNodesFromFlow, setEdgesFromFlow } = useClassGraph();
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

  const crop_box = getNormalizedBox(node, flowToScreenPosition, 660, 40, false);

  const handleGenerateDescription = async () => {
    try {
      const response = await generateDescription(
        image,
        crop_box,
        globalCaption
      );
      const label = response.label || "New Object";
      const description = response.description;

      if (label && description) {
        const groupNode = {
          id: `instance-${id}`,
          type: "instance-group",
          position: { x: node.position.x, y: node.position.y },
          data: {
            label,
            type: "object",
            sharedId: id,
            classId: `class-${id}`,
          },
        };

        const groupNode_ = {
          id: `class-${id}`,
          type: "object-group",
          position: { x: node.position.x, y: node.position.y },
          data: {
            label,
            type: "object",
          },
          measured: { width: 280, height: 500 },
          style: { width: 280, height: 500 },
        };

        const { nodes, edges } = await generateTextToGraph(
          description,
          `class-${id}`,
          groupNode_.position
        );

        const newNodes = [groupNode_, ...nodes];

        setNodes((prev) =>
          prev
            .map((n) => (n.id === id ? { ...n, type: "resizable", data: { ...n.data, type: "object" } } : n))
            .concat(groupNode)
        );
        setNodesFromFlow((prev) => [...prev, ...newNodes]);
        setEdgesFromFlow((prev) => [...prev, ...edges]);
      }
    } catch (error) {
      console.error("Error generating description:", error);
    }
  };

  const handleEraseFromImage = () => {
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

    setNodes((prev) =>
      prev
        .map((n) => (n.id === id ? { ...n, type: "resizable" } : n))
        .concat(emptyNode)
    );
  };

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
          top: "10px",
        }}
        ref={toolbarRef}
      >
        <HoverButton
          title="Generate graph from image"
          icon={<Network size={16} />}
          onClick={handleGenerateDescription}
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
