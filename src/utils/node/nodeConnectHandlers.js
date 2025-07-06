import { addEdge } from "@xyflow/react";
import { promptForNodeLabel, createRelationshipNode } from "./nodeCreateUtils";
import { v4 as uuidv4 } from "uuid";
import { logEvent } from "../../api/logEvent";

export function handleConnect({ params, nodes, setNodes, setEdges }) {
  const sourceNode = nodes.find((n) => n.id === params.source);
  const targetNode = nodes.find((n) => n.id === params.target);

  if (!sourceNode || !targetNode) return;

  if (targetNode.type === "resizable") {
    if (params.targetHandle === "size") {
      const sourceWidth = parseFloat(sourceNode?.width) || 100;
      const sourceHeight = parseFloat(sourceNode?.height) || 100;

      setNodes((nds) =>
        nds.map((node) =>
          node.id === targetNode.id
            ? {
                ...node,

                width: sourceWidth,
                height: sourceHeight,
              }
            : node
        )
      );

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            label: "size",
            data: { relationType: "size" },
          },
          eds
        )
      );

      logEvent("layoutboard.node.resizable.size_connected", {
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        size: { width: sourceWidth, height: sourceHeight },
      });
    } else if (params.targetHandle === "position") {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            label: "position",
            data: { relationType: "position" },
          },
          eds
        )
      );

      logEvent("layoutboard.node.resizable.position_connected", {
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
      });
    }

    return;
  }

  const sourceType = sourceNode.data.type;
  const targetType = targetNode.data.type;

  if (sourceType === "object" && targetType === "object") {
    const centerPos = {
      x: (sourceNode.position.x + targetNode.position.x) / 2,
      y: (sourceNode.position.y + targetNode.position.y) / 2,
    };

    const uniqueId = uuidv4();

    const { newNode, newEdges } = createRelationshipNode({
      sourceNode,
      targetNode,
      position: centerPos,
      nodeCount: uniqueId,
    });

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, ...newEdges]);

    logEvent("node.add.relationship", {
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
      relationshipType: newNode.data.label,
      relNodeId: newNode.id,
      position: centerPos,
    });
  } else if (
    (sourceType === "object" && targetType === "attribute") ||
    (sourceType === "attribute" && targetType === "object")
  ) {
    setEdges((eds) => addEdge({ ...params, label: "property" }, eds));

    logEvent("node.connect.attribute", {
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
      direction: `${sourceType}->${targetType}`,
    });
  } else {
    logEvent("node.connect.invalid", {
      sourceType,
      targetType,
      sourceNodeId: sourceNode?.id,
      targetNodeId: targetNode?.id,
      reason: "Unsupported connection type",
    });
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

    if (
      connectionState.fromNode.data.type !== "object" ||
      connectionState.fromNode.type == "resizable"
    ) {
      // alert(
      //   `'${connectionState.fromNode.data.type}' 타입에서는 새 노드를 생성할 수 없습니다.`
      // );
      logEvent("node.connect.invalid", {
        sourceType: connectionState.fromNode.data.type,
        sourceNodeId: connectionState.fromNode?.id,
        reason: "Invalid node type for connection",
      });
      return;
    }

    const uniqueId = uuidv4();

    const id = `${type}-${connectionState.fromNode.data.label}-attr-${uniqueId}`;
    const label = `${connectionState.fromNode.data.label}-attr`;

    const newNode = {
      id,
      position: screenToFlowPosition({ x: clientX, y: clientY }),
      type: type,
      data: {
        label,
        type: "attribute",
        hasValue: label,
        justCreated: true,
        instanceId: connectionState.fromNode?.data?.instanceId, // ✅ 이 object instance에 연결된다고 명시
        parentNode:
          connectionState.fromNode?.type == "instance-group"
            ? connectionState.fromNode?.data.classId
            : connectionState.fromNode?.id, // ✅ layout, 트리에서 종속 구조로 인식
        extent: "parent", // ✅ layout 상 따라다님
      },
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

    logEvent("node.add.attribute", {
      sourceNodeId: connectionState.fromNode.id,
      targetNodeId: id,
      attributeType: label,
    });

    return {
      newNodes: [newNode],
      newEdges: [
        {
          id,
          source: connectionState.fromNode.id,
          target: id,
          label: "property",
        },
      ],
    };
  }
}
