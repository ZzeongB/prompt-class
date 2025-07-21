// ✅ UUID import
import { v4 as uuidv4 } from "uuid";
import { createAttributeNode, getConnectedAttributes } from "./handleAttribute";

// ✅ 단순 객체 인스턴스 생성 함수
export function createInstanceFromClassNode(
  event,
  id,
  label,
  type,
  screenToFlowPosition,
  classNodes,
  classEdges,
  updatedAt = new Date().toISOString()
) {
  const uniqueId = uuidv4();
  const sharedId = `instance-${id.split("-")[1]}-${uniqueId}`;
  const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

  const newNode = {
    id: sharedId,
    type: type === "class-group" ? "instance-group" : "instance",
    position,
    data: {
      label,
      type: type === "class-group" ? "object" : type,
      sharedId,
      classId: id,
      instanceId: sharedId,
    },
    updatedAt,
  };

  const classNode = classNodes.find(
    (n) => n.data.label === label && n.data.type === "object"
  );
  const connectedAttrNodes = getConnectedAttributes(
    classNode,
    classNodes,
    classEdges
  );

  const newAttrNodes = [];
  const newAttrEdges = [];

  for (const attr of connectedAttrNodes) {
    if (!attr.data.hasValue) {
      const attrNode = createAttributeNode(
        attr,
        position,
        sharedId,
        sharedId,
        {},
        updatedAt
      );
      if (attrNode) {
        newAttrNodes.push(attrNode);
        newAttrEdges.push({
          id: `${newNode.id}-${attrNode.id}`,
          source: newNode.id,
          target: attrNode.id,
          label: "property",
        });
      }
    }
  }

  const nodes = [
    {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position: { x: position.x, y: position.y },
      data: newNode.data,
      style: { height: 50, width: 50 },
    },
    newNode,
    ...newAttrNodes,
  ];

  return { newNodes: nodes, newEdges: newAttrEdges };
}
