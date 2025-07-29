import React from "react";
import EditableLabel from "../nodeComponents/EditableLabel";
import DeleteButton from "../nodeComponents/DeleteButton";

const RelationshipNode = ({
  relationship,
  objects,
  onEdit,
  onDelete,
  isHovered,
  setIsHovered,
  isEditable = true,
  compact = false,
}) => {
  const sourceObject = objects.find((obj) => obj.id === relationship.source);
  const targetObject = objects.find((obj) => obj.id === relationship.target);

  const handleEdit = (newValue) => {
    onEdit?.(relationship.source, relationship.target, newValue);
  };

  const handleDelete = () => {
    onDelete?.(relationship.source, relationship.target);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? "3px" : "4px",
          // backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "4px",
          padding: compact ? "1px 2px" : "2px 3px",
          // boxShadow: isHovered
          //   ? "0 2px 8px rgba(0, 0, 0, 0.15)"
          //   : "0 1px 3px rgba(0, 0, 0, 0.1)",
          // border: "1px solid rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(2px)",
        }}
      >
        {isEditable ? (
          <EditableLabel
            value={relationship.relation}
            onSave={handleEdit}
            textStyle={{
              border: "1px solid #86efac",
              backgroundColor: isHovered ? "#bbf7d0" : "#dcfce7",
              color: "#15803d",
              fontSize: compact ? "10px" : "11px",
              padding: compact ? "1px 3px" : "2px 4px",
              fontWeight: 500,
              borderRadius: "3px",
              minWidth: compact ? "20px" : "24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            inputStyle={{
              border: "2px solid #16a34a",
              backgroundColor: "#f0fdf4",
              color: "#15803d",
              fontSize: compact ? "10px" : "11px",
              padding: compact ? "1px 3px" : "2px 4px",
              fontWeight: 500,
              borderRadius: "3px",
              textAlign: "center",
              minWidth: compact ? "30px" : "40px",
            }}
          />
        ) : (
          <div
            style={{
              border: "1px solid #86efac",
              backgroundColor: isHovered ? "#bbf7d0" : "#dcfce7",
              color: "#15803d",
              fontSize: compact ? "10px" : "11px",
              padding: compact ? "1px 3px" : "2px 4px",
              fontWeight: 500,
              borderRadius: "3px",
              minWidth: compact ? "20px" : "24px",
              textAlign: "center",
              transition: "all 0.2s ease",
            }}
          >
            {relationship.relation}
          </div>
        )}

        {isEditable && isHovered && (
          <button
            onClick={handleDelete}
            style={{
              background: "#fecaca",
              border: "1px solid #f87171",
              borderRadius: "3px",
              width: compact ? "14px" : "16px",
              height: compact ? "14px" : "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: compact ? "10px" : "11px",
              color: "#dc2626",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? "scale(1)" : "scale(0.8)",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f87171";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#fecaca";
              e.target.style.color = "#dc2626";
            }}
            title="Delete Relationship"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default RelationshipNode;
