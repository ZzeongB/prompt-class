import React, { useState } from "react";

export default function PromptModal({ title, defaultValue = "", onSubmit, onCancel }) {
  const [input, setInput] = useState(defaultValue);

  return (
    <div style={{
      position: "fixed",
      top: "0", left: "0", width: "100%", height: "100%",
      background: "rgba(0,0,0,0.4)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "20px",
        width: "300px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      }}>
        <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "bold" }}>{title}</h4>
        <input
          autoFocus
          style={{ width: "100%", padding: "6px", fontSize: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit(input);
          }}
        />
        <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "6px" }}>
          <button onClick={onCancel} style={{ fontSize: "12px" }}>Cancel</button>
          <button onClick={() => onSubmit(input)} style={{ fontSize: "12px", fontWeight: "bold" }}>OK</button>
        </div>
      </div>
    </div>
  );
}
