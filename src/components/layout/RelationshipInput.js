import React from "react";

const RelationshipInput = ({ relationshipInput, onSubmit, onCancel }) => {
  if (!relationshipInput) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
        backgroundColor: "#ffffff",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        minWidth: "250px",
      }}
    >
      <div style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "500" }}>
        Define Relationship
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.target.elements.relationship;
          onSubmit(input.value);
        }}
      >
        <input
          name="relationship"
          type="text"
          placeholder="Enter relationship (e.g., 'next to', 'above', 'contains')"
          autoFocus
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            marginBottom: "12px",
            outline: "none",
            boxSizing: "border-box",
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
              padding: "8px 16px",
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
              padding: "8px 16px",
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

export default RelationshipInput;