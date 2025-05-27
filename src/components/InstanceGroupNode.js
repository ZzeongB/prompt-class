// InstanceGroupNode.js
import GroupNode from "./GroupNode";
import { recalculateLayout } from "../utils/recalculateLayout.js";
import { useReactFlow, useUpdateNodeInternals } from "@xyflow/react";

export default function InstanceGroupNode(props) {
  const { setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const handleToggleCollapse = (id) => {
    setNodes((prev) => {
      const updated = prev.map((n) => {
        if (n.id === id) {
          const collapsed = !n.data?.collapsed;
          return {
            ...n,
            data: {
              ...n.data,
              collapsed,
            },
            style: {
              ...n.style,
              height: collapsed ? 50 : n.data?.expandedHeight ?? 200,
            },
          };
        }
        return n;
      });

      // ⚠️ 핵심: 높이 변경을 React Flow에게 알림
      updateNodeInternals(id);

      return recalculateLayout({ nodes: updated });
    });
  };

  return (
    <GroupNode
      {...props}
      dragSourceType="instance"
      withBackground={true}
      onToggleCollapse={handleToggleCollapse}
    />
  );
}
