import React, { forwardRef, useEffect, useRef, useState } from "react";

const LabelEditor = forwardRef(
  ({ type, label, onChange, alignToLabel, onSave, isBaseline }, ref) => {
    const containerStyle = alignToLabel
      ? {
          position: "relative",
          width: "100%",
          height: "24px",
          overflow: "visible",
          minHeight: "30px",
        }
      : {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          height: "100%",
        };

    return (
      <div style={containerStyle}>
        <div
          style={{
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "pre",
            fontSize: "11px",
            padding: "0 6px",
            fontFamily: "inherit",
          }}
        >
          {label || "Enter label..."}
        </div>
        {!isBaseline && (
          <div
            style={{
              fontSize: "10px",
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "2px",
              paddingLeft: "6px",
            }}
          >
            {type}
          </div>
        )}

        <textarea
          ref={ref}
          value={label}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            fontSize: "11px",
            lineHeight: "1.2",
            padding: "4px 6px",
            border: "none",
            backgroundColor: "transparent",
            color: "#333",
            outline: "none",
            resize: "none", // 또는 "vertical"
            overflow: "hidden",
            boxSizing: "border-box",
          }}
          rows={1}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
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
