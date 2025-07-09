import {
  OBJ_COLOR_TRANS,
  REL_COLOR_TRANS,
  ATTR_COLOR_TRANS,
} from "../../utils/constants";
import { useDnD } from "../../context/DragAndDropContext";

const GhostNode = () => {
  const [, , type, , position, , label] = useDnD();

  if (!type) return null;

  return (
    <div
      style={{
        pointerEvents: "none", // ✅ 이거 없으면 onDrop 안 먹힘
        position: "fixed",
        top: position.y,
        left: position.x,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        opacity: 0.8,
        zIndex: 9999,
        // border: "2px solid #333",
        borderRadius: 8,
        padding: 8,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          type === "attribute"
            ? ATTR_COLOR_TRANS
            : (type === "object") | (type === "class-group")
            ? OBJ_COLOR_TRANS
            : type === "relationship"
            ? REL_COLOR_TRANS
            : "#D6D6FF",
        fontSize: "12px",
      }}
    >
      {label}
    </div>
  );
};

export default GhostNode;
