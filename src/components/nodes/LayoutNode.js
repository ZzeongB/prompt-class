import { useReactFlow } from "@xyflow/react";
import { duplicateNodesWithMapping } from "../../utils/node/duplicateUtils";
import { useInstanceGraph } from "../../context/InstanceGraphContext";
import BaseNode from "./BaseNode";

export default function LayoutNode({ id, data }) {
  const { getNodes, setNodes, deleteElements } = useReactFlow();
  const { setInstanceNodes, setHighlight } = useInstanceGraph();

  const handleDelete = () => {
    const nodes = getNodes();
    const sharedId = data.sharedId ?? id;
    const toDelete = nodes.filter(
      (n) => n.id === id || n.data?.sharedId === sharedId
    );

    deleteElements({ nodes: toDelete });

    // ✅ InstanceGraphContext에도 반영
    const remaining = nodes.filter((n) => !toDelete.includes(n));
    setInstanceNodes(remaining);
  };

  const handleDuplicate = () => {
    setNodes((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target) return prev;

      const sharedId = target.data?.sharedId ?? id;
      const group = prev.filter(
        (n) => n.data?.sharedId === sharedId || n.id === id
      );

      const existingLabels = prev.map((n) => n.data.label);

      const { duplicated } = duplicateNodesWithMapping(group, {
        sharedIdBase: sharedId,
        existingLabels: existingLabels,
      });

      const updated = [...prev, ...duplicated];

      // ✅ 제한 검사
      const newNonResizable = updated.filter(
        (n) => n.type !== "resizable"
      ).length;

      if (newNonResizable > 10) {
        alert("최대 10개의 노드까지만 생성할 수 있습니다.");
        return prev;
      }

      setInstanceNodes(updated);
      return updated;
    });
  };

  const handleLabelUpdate = (newLabel) => {
    setNodes((prevNodes) => {
      const updated = prevNodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                label: newLabel,
                hasValue: newLabel,
                justCreated: false,
              },
            }
          : node
      );
      setInstanceNodes(updated); // ✅ InstanceGraphContext에도 반영
      return updated;
    });
  };

  const handleClick = () => setHighlight(id);
  const handleClickCancel = () => setHighlight(null);

  return (
    <BaseNode
      id={id}
      data={data}
      nodeType="instance"
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
      onLableUpdate={handleLabelUpdate}
      onClickProp={handleClick}
      onClickCancelProp={handleClickCancel}
      fontSize={10}
    />
  );
}
