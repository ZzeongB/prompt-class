import React from "react";

const InlinePrompt = ({ inlinePrompt, onSubmit, onCancel }) => {
  if (!inlinePrompt) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: inlinePrompt.position.x,
        top: inlinePrompt.position.y,
        zIndex: 1000,
        backgroundColor: "#ffffff",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        minWidth: "200px",
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.target.elements.prompt;
          onSubmit(input.value);
        }}
      >
        <input
          name="prompt"
          type="text"
          placeholder="Describe what you want..."
          autoFocus
          autoComplete="off"
          style={{
            width: "204px",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            marginBottom: "8px",
            outline: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onCancel();
            }
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "6px 12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default InlinePrompt;