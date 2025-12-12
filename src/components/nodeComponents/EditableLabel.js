import React, { useState, useEffect } from "react";

const EditableLabel = ({
  value,
  onSave,
  style = {},
  inputWidth = 60,
  textStyle = {},
  inputStyle = {},
  autoFocus = false,
  isEditable = true,
  autoEdit = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  // autoEdit이 true면 자동으로 편집 모드 시작
  useEffect(() => {
    if (autoEdit && !editing) {
      setEditing(true);
      setTemp(""); // 빈 문자열로 시작
    }
  }, [autoEdit]);

  const handleSave = () => {
    // 항상 onSave 호출 (빈 값이어도), 부모가 처리 결정
    onSave(temp.trim());
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
      autoFocus={true}
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
      onClick={(e) => {
        e.stopPropagation();
        if (isEditable) setEditing(true);
      }}
      style={{
        cursor: "pointer",
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
