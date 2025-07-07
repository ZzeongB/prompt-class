import {
  useReactFlow,
  Position,
  NodeResizeControl,
  useConnection,
} from "@xyflow/react";
import {
  OBJ_COLOR_TRANS,
  REL_COLOR_TRANS,
  ATTR_COLOR_TRANS,
} from "../../utils/constants";
import { useDnD } from "../../context/DragAndDropContext";
import { useState, useRef, useEffect } from "react";
import {
  duplicateNodesWithMapping,
  duplicateEdges,
} from "../../utils/node/duplicateUtils";
import NodeToolbarMenu from "../nodeComponents/NodeToolbarMenu";
import { ChevronRight, ChevronDown } from "lucide-react";
import NodeHandles from "../nodeComponents/NodeHandles";
import DragHandle from "../nodeComponents/DragHandle";
import LabelEditor from "../nodeComponents/LabelEditor";
import { generateTextToGraph } from "../../api/generateTextToGraph";
import { logEvent } from "../../api/logEvent";

const controlStyle = {
  background: "transparent",
  border: "none",
};

export default function GroupNode({
  id,
  data,
  onToggleCollapse,
  dragSourceType,
  forceType = null,
  withBackground = false,
  resizable = false,
}) {
  const label = data.hasValue ? data.hasValue : data.label;
  const [, setId, , setType, , setPosition, , setLabel, , setDragSource] =
    useDnD();
  const [handlePos, setHandlePos] = useState("");
  const { setNodes, getNodes, getEdges, setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const inputRef = useRef(null);
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
        setIsEditing(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside, true);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside, true);
  }, []);

  useEffect(() => {
    if (data.justCreated) {
      setTimeout(() => {
        setIsEditing(true);
      }, 0);
    }
  }, [data.justCreated]);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [isEditing]);

  const onDragStart = (e) => {
    if (e.target.closest(".classHandle")) return;

    setType(forceType ?? data.type); // 강제 타입 설정이 있으면 사용
    setLabel(data.label);
    setId(id);
    setDragSource(dragSourceType);

    const onMouseMove = (e) => setPosition({ x: e.clientX, y: e.clientY });

    const onMouseUp = () => {
      setType(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onResize = (event, { width, height }) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;

        const newWidth = Number.isFinite(width) ? width : 200;
        const newHeight = Number.isFinite(height) ? height : 200;
        const prevWidth = n.style?.width ?? n.data?.expandedWidth ?? 200;
        const prevHeight = n.style?.height ?? n.data?.expandedHeight ?? 200;

        // 기본값: position 그대로
        let newPosition = { ...n.position };

        // ⬅️ 왼쪽 리사이즈면 x 위치 이동
        if (handlePos?.includes("left")) {
          const deltaX = prevWidth - newWidth;
          newPosition.x = n.position.x + deltaX;
        }

        // ⬆️ 위쪽 리사이즈면 y 위치 이동
        if (handlePos?.includes("top")) {
          const deltaY = prevHeight - newHeight;
          newPosition.y = n.position.y + deltaY;
        }

        return {
          ...n,
          position: newPosition,
          data: {
            ...n.data,
            expandedHeight: newHeight,
            expandedWidth: newWidth,
          },
          style: {
            ...n.style,
            height: newHeight,
            width: newWidth, // ✅ 이걸 꼭 넣어야 React Flow가 외부 style로 렌더
          },
        };
      })
    );
  };

  const color =
    data.type === "object"
      ? OBJ_COLOR_TRANS
      : data.type === "relationship"
      ? REL_COLOR_TRANS
      : ATTR_COLOR_TRANS;

  const handleLabelUpdate = () => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                label: editLabel,
                hasValue: editLabel,
                justCreated: false,
              },
            }
          : node
      )
    );
    logEvent("node.group.edit_label", {
      nodeId: id,
      newLabel: editLabel,
      nodeType: "group",
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    const allNodes = getNodes();
    const children = allNodes.filter((n) => n.parentNode === id);

    logEvent("node.group.delete", {
      nodeId: id,
      children: children.map((c) => c.id),
      nodeType: "group",
    });

    setNodes((prevNodes) =>
      prevNodes.filter((node) => node.id !== id && node?.parentNode !== id)
    );
  };

  const handleDuplicateNode = () => {
    const allNodes = getNodes();
    const allEdges = getEdges();

    const groupNode = allNodes.find((n) => n.id === id);
    const children = allNodes.filter((n) => n.parentNode === id);

    const { duplicated, idMap, randomId } = duplicateNodesWithMapping(
      [groupNode, ...children],
      {
        offset: { x: 0, y: 350 },
      }
    );

    const duplicatedRelatedEdges = duplicateEdges(allEdges, idMap, randomId);

    logEvent("node.group.duplicate", {
      sourceId: id,
      children: children.map((c) => c.id),
      duplicatedCount: duplicated.length,
      nodeType: "group",
    });

    setNodes((prev) => [...prev, ...duplicated]);
    setEdges((prev) => [...prev, ...duplicatedRelatedEdges]);
  };

  const getMyPosition = () => {
    const currentNode = getNodes().find((n) => n.id === id);
    return currentNode?.position ?? { x: 0, y: 0 };
  };

  const handleGraphFromText = async () => {
    const position = getMyPosition();
    logEvent("node.group.text_to_graph_requested", {
      sourceNodeId: id,
      text: editLabel,
      position,
      nodeType: "group",
    });

    const { nodes, edges } = await generateTextToGraph(editLabel, id, position);

    logEvent("node.group.text_to_graph_generated", {
      sourceNodeId: id,
      nodes: nodes, 
      edges: edges,
    });

    setNodes((prev) => [...prev, ...nodes]);
    setEdges((prev) => [...prev, ...edges]);
  };

  return (
    <div
      ref={nodeRef}
      style={{ position: "relative", pointerEvents: "auto" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      <NodeToolbarMenu
        ref={toolbarRef}
        isVisible={isSelected || isEditing}
        isEditing={isEditing}
        data={data}
        position={Position.Top}
        style={{ top: "25px", left: "-20px" }}
        onEditToggle={() => setIsEditing(true)}
        onSave={handleLabelUpdate}
        onDuplicate={handleDuplicateNode}
        onDelete={handleDelete}
        onConvertFromText={handleGraphFromText}
      />

      {resizable && isSelected && !data.collapsed ? (
        <NodeResizeControl
          style={controlStyle}
          minWidth={100}
          minHeight={50}
          onResize={onResize}
        >
          <ResizeIcon />
        </NodeResizeControl>
      ) : (
        <></>
      )}
      <DragHandle isVisible={isHovered} />
      <div
        onMouseDown={onDragStart}
        className="nodrag"
        style={{
          padding: 10,
          border: "5px solid",
          borderColor: color,
          borderRadius: 12,
          height: data.collapsed ? 25 : data.expandedHeight ?? 200,
          minWidth: 100, // ✅ 최소 너비 보장
          ...(withBackground ? { background: color } : {}),
        }}
      >
        {isEditing ? (
          <LabelEditor
            ref={inputRef} // 포커스용 ref (선택 사항)
            type={data.type} // 위에 표시할 타입 (예: "attribute", "object")
            label={editLabel} // 현재 입력값
            onChange={setEditLabel} // 입력값 변경 핸들러
            alignToLabel={true}
            onSave={handleLabelUpdate}
          />
        ) : (
          <>
            {/* ✅ 여기에만 클릭 이벤트 걸기 */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleCollapse(id);
                logEvent("node.group.toggle_collapsed", {
                  nodeId: id,
                  collapsed: !data.collapsed,
                  nodeType: "group",
                });
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
            >
              <strong>{data.label}</strong>
              <span style={{ flexShrink: 0 }}>
                {data.collapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </span>
            </span>
          </>
        )}
      </div>
      <NodeHandles id={id} isSelected={isSelected} nodeType={data.type} />
    </div>
  );
}

function ResizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="#ff0071"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: "absolute", right: 5, bottom: 5 }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="16 20 20 20 20 16" />
      <line x1="14" y1="14" x2="20" y2="20" />
      <polyline points="8 4 4 4 4 8" />
      <line x1="4" y1="4" x2="10" y2="10" />
    </svg>
  );
}
