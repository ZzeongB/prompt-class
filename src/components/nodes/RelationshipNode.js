import EditableLabel from "../nodeComponents/EditableLabel"
import DeleteButton from "../nodeComponents/DeleteButton";

const RelationshipNode = ({
  relationship,
  objects,
  onEdit,
  onDelete,
  isHovered,
  setIsHovered,
}) => {
  const sourceObject = objects.find((obj) => obj.id === relationship.source);
  const targetObject = objects.find((obj) => obj.id === relationship.target);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "2px 0",
        position: "relative",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", zIndex: 2 }}>
        <EditableLabel
          value={relationship.relation}
          onSave={(val) => onEdit?.(relationship.source, relationship.target, val)}
          textStyle={{
            border: "1px solid #86efac",
            backgroundColor: isHovered ? "#bbf7d0" : "#dcfce7",
            color: "#15803d",
            fontSize: "11px",
            padding: "2px 6px",
            fontWeight: 500,
            borderRadius: "4px",
          }}
        />
        {isHovered && (
          <DeleteButton
            onClick={() => onDelete?.(relationship.source, relationship.target)}
            size={10}
            title="Delete Relationship"
          />
        )}
      </div>
    </div>
  );
};

export default RelationshipNode;