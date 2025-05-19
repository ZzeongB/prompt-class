import { useReactFlow } from "@xyflow/react";
import { OBJ_COLOR, REL_COLOR, ATTR_COLOR } from "../utils/constants";
function hexToRGBA(hex, alpha = 0.2) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ClassGroupNode({ id, data }) {
  const { getNodes, setNodes } = useReactFlow();

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

  const color = hexToRGBA(
    data.type === "object"
      ? OBJ_COLOR
      : data.type === "relationship"
      ? REL_COLOR
      : ATTR_COLOR
  );

  return (
    <div
      onClick={toggleCollapse}
      style={{
        padding: 10,
        // transition: "height 0.3s ease",
        border: "2px solid",
        borderColor: color,
        borderRadius: 12,
        height: data.collapsed ? 25 : data.expandedHeight ?? 200,
        background: color,
      }}
      className="nodrag"
    >
      <strong>{data.label}</strong> {data.collapsed ? "▶" : "▼"}
    </div>
  );
}
