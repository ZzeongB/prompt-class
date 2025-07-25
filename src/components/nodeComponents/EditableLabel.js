import React, { useState } from "react";

const EditableLabel = ({
  value,
  onSave,
  style = {},
  inputWidth = 60,
  textStyle = {},
  inputStyle = {},
  autoFocus = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  const handleSave = () => {
    if (temp.trim() !== "") {
      onSave(temp.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setTemp(value);
    setEditing(false);
  };

  return editing ? (
    <input
      value={temp}
      onChange={(e) => setTemp(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") handleCancel();
      }}
      autoFocus={autoFocus}
      style={{
        fontSize: "11px",
        padding: "1px 3px",
        border: "1px solid #3b82f6",
        borderRadius: "4px",
        backgroundColor: "#ffffff",
        color: "#1f2937",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: "500",
        width: `${Math.max(4, temp.length + 1)}ch`,
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
        textAlign: "center",
        ...inputStyle,
      }}
    />
  ) : (
    <div
      onDoubleClick={() => setEditing(true)}
      style={{
        cursor: "text",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...textStyle,
      }}
    >
      {value}
    </div>
  );
};

export default EditableLabel;
