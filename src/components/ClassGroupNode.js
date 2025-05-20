import { useReactFlow } from "@xyflow/react";
import {
  OBJ_COLOR_TRANS,
  REL_COLOR_TRANS,
  ATTR_COLOR_TRANS,
} from "../utils/constants";
import { useDnD } from "../context/DragAndDropContext";

export default function ClassGroupNode({ id, data }) {
  const { getNodes, setNodes } = useReactFlow();
  const [, setId, , setType, , setPosition, , setLabel] = useDnD();

  const onDragStart = (e, data) => {
    if (e.target.closest(".classHandle")) {
      return;
    }

    console.log("onDragStart", data);
    setType(data.type);
    setLabel(data.label);
    setId(id);

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const onMouseUp = () => {
      console.log("onMouseUp");
      setType(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const toggleCollapse = () => {
    const nodes = getNodes();
    setNodes(
      nodes.map((node) => {
        if (node.id === id) {
          const isCollapsed = !node.data?.collapsed;
          return {
            ...node,
            data: {
              ...node.data,
              collapsed: isCollapsed,
            },
            style: {
              ...node.style,
              height: isCollapsed ? 50 : node.data?.expandedHeight ?? 200, // 👈 확장 높이 기억
            },
          };
        }
        return node;
      })
    );
  };

  const color =
    data.type === "object"
      ? OBJ_COLOR_TRANS
      : data.type === "relationship"
      ? REL_COLOR_TRANS
      : ATTR_COLOR_TRANS;

  return (
    <div
      onClick={toggleCollapse}
      style={{
        padding: 10,
        // transition: "height 0.3s ease",
        border: "5px solid",
        borderColor: color,
        borderRadius: 12,
        height: data.collapsed ? 25 : data.expandedHeight ?? 200,
        // background: color,
      }}
      className="nodrag"
      onMouseDown={(e) => onDragStart(e, data)}
    >
      <strong>{data.label}</strong> {data.collapsed ? "▶" : "▼"}
    </div>
  );
}
