import React from "react";

function ProgressBar({ now, errorMessage = "" }) {
  const isError = !!errorMessage;

  return (
    <div style={{ width: "75%", position: "relative" }}>
      <div
        style={{
          height: "20px",
          backgroundColor: "#e0e0e0",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${now}%`,
            background: isError ? "#ff4d4f" : "#9A90FF",
            transition: "width 0.3s ease-in-out",
          }}
        />
      </div>

      {isError && (
        <div
          style={{
            marginTop: "4px",
            color: "#ff4d4f",
            fontSize: "12px",
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
