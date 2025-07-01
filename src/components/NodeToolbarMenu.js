import React from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import HoverButton from "./HoverButton"; // 경로 맞게 수정
import { Edit2, Check, Copy, Trash2, Repeat, Trash } from "lucide-react";

function NodeToolbarMenu({
  isVisible,
  isEditing,
  position = Position.Top,
  style = {},
  data, // 🌀 버튼 조건에 필요
  onEditToggle,
  onSave,
  onConvertBlank, // 🌀 버튼 액션
  onDuplicate,
  onDelete,
}) {
  return (
    <NodeToolbar
      isVisible={isVisible}
      position={position}
      style={{
        display: "flex",
        alignItems: "center",
        // padding: "6px 10px",
        backgroundColor: "#2B2B2B",
        borderRadius: "10px",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(4px)",
        ...style,
      }}
    >
      <HoverButton
        title={isEditing ? "Save as fixed value" : "Edit label"}
        icon={isEditing ? <Check size={16}/> : <Edit2 size={16}/>}
        onClick={isEditing ? onSave : onEditToggle}
      />

      {data?.type === "attribute" && isEditing && (
        <HoverButton
          title="Convert to blank attribute"
          icon={<Repeat size={16}/>}
          onClick={onConvertBlank}
        />
      )}

      <HoverButton title="Duplicate node" icon={<Copy size={16}/>} onClick={onDuplicate} />
      <HoverButton title="Delete node" icon={<Trash2 size={16}/>} danger onClick={onDelete} />
    </NodeToolbar>
  );
}

export default NodeToolbarMenu;
