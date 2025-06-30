import React from "react";

function ProgressBar({ now }) {
    return (
    <div
      style={{
        width: "75%",
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
          width: `${now + 2}%`,
          background: "#9A90FF", //"linear-gradient(90deg, #9A90FF, #63B4FF)",
          transition: "width 0.3s ease-in-out",
        }}
      />
    </div>
  );
}

export default ProgressBar;
