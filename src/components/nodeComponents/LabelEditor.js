import React, { forwardRef, useEffect, useRef, useState } from "react";

const LabelEditor = forwardRef(
  ({ type, label, onChange, alignToLabel, onSave }, ref) => {
    const spanRef = useRef(null);
    const [inputWidth, setInputWidth] = useState(80); // 최소값

    useEffect(() => {
      if (spanRef.current) {
        const width = spanRef.current.offsetWidth;
        setInputWidth(Math.max(width + 16, 80)); // padding 고려
      }
    }, [label]);

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
          width: "100%",
          height: "100%",
          overflow: "hidden",
          maxWidth: "80px",
        };

    const inputStyle = {
      width: `${inputWidth}px`,
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
        <div
          style={{
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "pre",
            fontSize: "13px",
            padding: "0 6px",
            fontFamily: "inherit",
          }}
          ref={spanRef}
        >
          {label || "Enter label..."}
        </div>

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
