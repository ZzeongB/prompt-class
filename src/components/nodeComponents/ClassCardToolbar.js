import { ToolbarButton } from "./NodeToolbarMenu";
import { Plus, Trash2 } from "lucide-react";

const ClassCardToolbar = ({ isVisible, onCreateInstance, onDelete }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "-36px", // 노드 위쪽에 배치
        // right: "8px",
        display: isVisible ? "flex" : "none",
        alignItems: "center",
        gap: "2px",
        padding: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "8px",
        boxShadow:
          "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
      }}
    >
      <ToolbarButton
        title="Create Instance"
        icon={<Plus size={12} />}
        onClick={onCreateInstance}
        backgroundColor="rgba(34, 197, 94, 0.1)"
        hoverColor="rgba(34, 197, 94, 0.15)"
      />

      <ToolbarButton
        title="Delete Class"
        icon={<Trash2 size={12} />}
        onClick={onDelete}
        danger={true}
      />
    </div>
  );
};

export default ClassCardToolbar;
