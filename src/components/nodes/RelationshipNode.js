import React from "react";
import EditableLabel from "../nodeComponents/EditableLabel";
import DeleteButton from "../nodeComponents/DeleteButton";
import { logEvent } from "../../api/logEvent";

import { ToolbarButton } from "../nodeComponents/NodeToolbarMenu";
import { X } from "lucide-react";

const RelationshipNode = ({
  relationship,
  objects,
  onEdit,
  onDelete,
  isHovered,
  setIsHovered,
  isEditable = true,
  compact = false,
  isPending = false,
  onEditComplete = () => {},
}) => {
  const sourceObject = objects.find((obj) => obj.id === relationship.source);
  const targetObject = objects.find((obj) => obj.id === relationship.target);

  const handleEdit = (newValue) => {
    logEvent("relationship_node.edited", {
      relationship_id: `${relationship.source}-${relationship.target}`,
      source_object_id: relationship.source,
      target_object_id: relationship.target,
      old_relation: relationship.relation,
      new_relation: newValue,
      source_object_name: sourceObject?.name,
      target_object_name: targetObject?.name,
      is_pending: isPending,
    });
    onEdit?.(relationship.source, relationship.target, newValue);

    // 편집 완료 시 pending 상태 해제
    if (isPending) {
      onEditComplete();
    }
  };

  const handleDelete = () => {
    logEvent("relationship_node.deleted", {
      relationship_id: `${relationship.source}-${relationship.target}`,
      source_object_id: relationship.source,
      target_object_id: relationship.target,
      relation: relationship.relation,
      source_object_name: sourceObject?.name,
      target_object_name: targetObject?.name,
    });
    onDelete?.(relationship.source, relationship.target);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1000,
      }}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? "3px" : "4px",
          border: "1px solid #86efac",
          backgroundColor: isHovered ? "#bbf7d0" : "#dcfce7",
          borderRadius: "4px",
          padding: compact ? "1px 2px" : "2px 3px",
          backdropFilter: "blur(2px)",
          transition: "all 0.2s ease",
        }}
      >
        {isEditable ? (
          <EditableLabel
            value={relationship.relation}
            onSave={handleEdit}
            autoEdit={isPending}
            textStyle={{
              border: "none",
              backgroundColor: "transparent",
              color: "#15803d",
              fontSize: compact ? "9px" : "10px",
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
              fontSize: compact ? "9px" : "10px",
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
              border: "none",
              backgroundColor: "transparent",
              color: "#15803d",
              fontSize: compact ? "9px" : "10px",
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

        {isEditable && (
          <ToolbarButton
            onClick={handleDelete}
            title="Delete Relationship"
            icon={<X size={compact ? 8 : 10} />}
            danger={true}
            tooltipPosition="top"
            size="compact"
          />
        )}
      </div>
    </div>
  );
};

export default RelationshipNode;
