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
import { logEvent } from "../../api/logEvent"; 
import { getNonOverlappingPosition } from "../../utils/node/getNonOverlappingPosition";
import { LEFT_OFFSET, TOP_OFFSET } from "../../utils/constants";

function TempResizableNode({ id, data, width, height }) {
  const { deleteElements, getNode, flowToScreenPosition, setNodes, setEdges } =
    useReactFlow();
  const { setInstanceNodes, setInstanceEdges } = useInstanceGraph();
  const { setNodesFromFlow, setEdgesFromFlow, classNodes } = useClassGraph();
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

  const crop_box = getNormalizedBox(node, flowToScreenPosition, LEFT_OFFSET, TOP_OFFSET, false);

  const handleGenerateDescription = async () => {
    try {
      logEvent("layoutboard.node.tmp-resizable.description_generation_requested", {
        nodeId: id,
        cropBox: crop_box,
        globalCaption,
      });

      const response = await generateDescription(
        image,
        crop_box,
        globalCaption
      );

      const label = response.label || "New Object";
      const description = response.description;

      logEvent("layoutboard.node.tmp-resizable.description_generated", {
        nodeId: id,
        label,
        description,
      });

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

        const position_classboard = getNonOverlappingPosition( classNodes, 280, 500, node.position.x, node.position.y, 50);
        const groupNode_ = {
          id: `class-${id}`,
          type: "object-group",
          position: position_classboard,
          data: {
            label,
            type: "object",
          },
          measured: { width: 280, height: 500 },
          style: { width: 280, height: 500 },
        };

        logEvent("layoutboard.node.tmp-resizable.text_to_graph_requested", {
          sourceNodeId: id,
          description,
        });

        const { nodes, edges } = await generateTextToGraph(
          description,
          `class-${id}`,
          groupNode_.position
        );

        logEvent("layoutboard.node.tmp-resizable.text_to_graph_generated", {
          sourceNodeId: id,
          nodes: nodes,
          edges: edges,
        });

        const newNodes = [groupNode_, ...nodes];

        setNodes((prev) =>
          prev
            .map((n) =>
              n.id === id
                ? {
                    ...n,
                    type: "resizable",
                    data: { ...n.data, type: "object" },
                  }
                : n
            )
            .concat(groupNode)
        );
        setInstanceNodes((prev) => [...prev, groupNode]);
        setNodesFromFlow((prev) => [...prev, ...newNodes]);
        setEdgesFromFlow((prev) => [...prev, ...edges]);
      }
    } catch (error) {
      console.error("Error generating description:", error);
      logEvent("layoutboard.node.tmp-resizable.description_generation_failed", {
        nodeId: id,
        error: error.message,
      });
    }
  };

  const handleEraseFromImage = () => {
    logEvent("layoutboard.node.tmp-resizable.erase_from_image", {
      nodeId: id,
      position: node?.position,
    });

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
          onClick={() => {
            logEvent("layoutboard.node.tmp-resizable.delete", { nodeId: id, from: "temp_resizable" });
            deleteElements({ nodes: [{ id }] });
          }}
        />
      </NodeToolbar>

      <NodeResizer color={EDGE_COLOR} minWidth={30} minHeight={30} />
      <div style={{ visibility: "hidden", height: "1em" }}>{data.label}</div>
    </div>
  );
}

export default memo(TempResizableNode);
