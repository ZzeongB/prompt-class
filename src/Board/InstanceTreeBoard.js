import React, { useEffect, useState, useMemo } from "react";
import InstanceTree from "../components/InstanceTree.js";
import { useInstanceGraph } from "../context/InstanceGraphContext.js";
import { useClassGraph } from "../context/ClassGraphContext.js";
import { getRenderedInstanceBoard } from "../utils/instance/getRenderedInstanceBoard.js";

function getClassGraphSignature(nodes, edges) {
  const nodeSig = nodes
    .map((n) => `${n.id}-${n.data?.label}-${JSON.stringify(n.data?.attributes ?? [])}`)
    .sort()
    .join("|");

  const edgeSig = edges
    .map((e) => `${e.source}-${e.target}-${e.label}`)
    .sort()
    .join("|");

  return `${nodeSig}::${edgeSig}`;
}

function InstanceTreeBoard() {
  const { classNodes, classEdges } = useClassGraph();
  const { instanceNodes, instanceEdges } = useInstanceGraph();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [filledAttrMap, setFilledAttrMap] = useState({});

  // ✅ classGraph 구조 변화에 대한 signature 생성
  const classGraphSignature = useMemo(
    () => getClassGraphSignature(classNodes, classEdges),
    [classNodes, classEdges]
  );

  // ✅ instanceNodes 또는 의미 있는 classGraph 변화가 있을 때만 렌더링
  useEffect(() => {
    const {
      nodes: newNodes,
      edges: newEdges,
      filledAttrMap: newFilledAttrMap,
    } = getRenderedInstanceBoard({
      instanceNodes,
      instanceEdges,
      classNodes,
      classEdges,
      filledAttrMap,
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setFilledAttrMap(newFilledAttrMap);
  }, [instanceNodes, classGraphSignature]); // 👈 핵심

  return (
    <div>
      <InstanceTree nodes={nodes} edges={edges} />
    </div>
  );
}

export default InstanceTreeBoard;
