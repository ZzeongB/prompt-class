import { ToolbarButton } from "./NodeToolbarMenu";
import { Plus, Trash2 } from "lucide-react";

const ClassCardToolbar = ({ isVisible, onCreateInstance, onDelete }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "-44px", // 높이 증가에 맞춰 조정
        display: isVisible ? "flex" : "none",
        alignItems: "center",
        gap: "4px",
        padding: "6px 8px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: "10px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 1000,
        minHeight: "40px",
        overflow: "visible",
        whiteSpace: "nowrap",
      }}
    >
      <ToolbarButton
        title="Create Instance"
        icon={<Plus size={14} />}
        onClick={onCreateInstance}
        tooltipPosition="top"
      />

      <ToolbarButton
        title="Delete Class"
        icon={<Trash2 size={14} />}
        onClick={onDelete}
        danger={true}
        tooltipPosition="top"
      />
    </div>
  );
};

export default ClassCardToolbar;
