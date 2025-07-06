import { useReactFlow } from "@xyflow/react";
import { duplicateNodesWithMapping } from "../../utils/node/duplicateUtils";
import { useInstanceGraph } from "../../context/InstanceGraphContext";
import BaseNode from "./BaseNode";

export default function LayoutNode({ id, data }) {
  const { getNodes, setNodes, deleteElements } = useReactFlow();
  const { setInstanceNodes } = useInstanceGraph();

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
      console.log("Existing labels for duplication:", existingLabels);

      const { duplicated } = duplicateNodesWithMapping(group, {
        sharedIdBase: sharedId,
        existingLabels: existingLabels,
      });

      console.log("Duplicated nodes:", duplicated);

      const updated = [...prev, ...duplicated];
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

  return (
    <BaseNode
      id={id}
      data={data}
      nodeType="instance"
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
      onLableUpdate={handleLabelUpdate}
      fontSize={10}
    />
  );
}
