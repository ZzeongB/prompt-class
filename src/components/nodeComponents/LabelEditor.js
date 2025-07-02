import React, { forwardRef } from "react";

const LabelEditor = forwardRef(
  ({ type, label, onChange, alignToLabel, onSave }, ref) => {
    const containerStyle = alignToLabel
      ? {
          position: "relative",
          width: "100%",
          height: "24px",
          overflow: "visible",
          minHeight: "30px", // ✅ fallback
        }
      : {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          maxWidth: "80px",
        };

    const typeStyle = alignToLabel
      ? {
          position: "absolute",
          top: "-10px",
          left: "6px",
          fontSize: "10px",
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          pointerEvents: "none",
        }
      : {
          fontSize: "10px",
          color: "#999",
          marginBottom: "2px",
          paddingLeft: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        };

    const inputStyle = alignToLabel
      ? {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          minWidth: "80px", // 최소 너비 보장
          height: "100%",
          fontSize: "13px",
          lineHeight: "1",
          padding: "0 6px",
          border: "none",
          backgroundColor: "transparent",
          color: "#333",
          outline: "none",
          boxSizing: "border-box",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }
      : {
          width: "100%",
          height: "100%",
          fontSize: "13px",
          lineHeight: "1",
          padding: "0 6px",
          border: "none",
          backgroundColor: "transparent",
          color: "#333",
          outline: "none",
          boxSizing: "border-box",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        };

    return (
      <div style={containerStyle}>
        <div style={typeStyle}>{type}</div>
        <input
          ref={ref}
          value={label}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          onClick={(e) => e.stopPropagation()}
          title={label}
          placeholder="Enter label..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
              onSave();
            }
          }}
        />
      </div>
    );
  }
);

export default LabelEditor;
