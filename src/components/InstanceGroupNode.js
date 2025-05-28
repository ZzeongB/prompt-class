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
          console.log("Toggling collapse for node:", n.id, "to", collapsed);
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

      const recalculated = recalculateLayout({ nodes: updated });

      console.log("Recalculated layout:", recalculated);

      return recalculated;
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
