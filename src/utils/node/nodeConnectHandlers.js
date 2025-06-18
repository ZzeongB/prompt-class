import { addEdge } from "@xyflow/react";
import { promptForNodeLabel, createRelationshipNode } from "./nodeCreateUtils";

export function handleConnect({ params, nodes, setNodes, setEdges }) {
  const sourceNode = nodes.find((n) => n.id === params.source);
  const targetNode = nodes.find((n) => n.id === params.target);

  if (!sourceNode || !targetNode) return;

  const sourceType = sourceNode.data.type;
  const targetType = targetNode.data.type;

  if (sourceType === "object" && targetType === "object") {
    const centerPos = {
      x: (sourceNode.position.x + targetNode.position.x) / 2,
      y: (sourceNode.position.y + targetNode.position.y) / 2,
    };

    const { newNode, newEdges } = createRelationshipNode({
      sourceNode,
      targetNode,
      position: centerPos,
      nodeCount: nodes.length,
    });

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, ...newEdges]);
  } else if (
    (sourceType === "object" && targetType === "attribute") ||
    (sourceType === "attribute" && targetType === "object")
  ) {
    setEdges((eds) => addEdge({ ...params, label: "property" }, eds));
  } else {
    alert(`'${sourceType}'와 '${targetType}' 타입은 연결될 수 없습니다.`);
  }
}

export function handleConnectEnd({
  event,
  connectionState,
  type,
  nodes,
  setNodes,
  setEdges,
  screenToFlowPosition,
}) {
  if (type !== "class" && type !== "instance") return;
  if (!connectionState.isValid && connectionState.fromNode) {
    const { clientX, clientY } =
      "changedTouches" in event ? event.changedTouches[0] : event;

    if (connectionState.fromNode.data.type !== "object") {
      alert(
        `'${connectionState.fromNode.data.type}' 타입에서는 새 노드를 생성할 수 없습니다.`
      );
      return;
    }

    const id = `${type}-${connectionState.fromNode.data.label}-attr-${nodes.length}`;
    const label = `${connectionState.fromNode.data.label}-attr-${nodes.length}`;

    const newNode = {
      id,
      position: screenToFlowPosition({ x: clientX, y: clientY }),
      type: type,
      data: { label, type: "attribute", hasValue: label, justCreated: true },
      origin: [0.5, 0.0],
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) =>
      eds.concat({
        id,
        source: connectionState.fromNode.id,
        target: id,
        label: "property",
      })
    );
  }
}
