// App.jsx

import React, { useEffect, useState } from "react";
import InstanceTree from "../components/InstanceTree.js";
import { useInstanceGraph } from "../context/InstanceGraphContext.js";
import { useClassGraph } from "../context/ClassGraphContext.js";
import { getRenderedInstanceBoard } from "../utils/getRenderedInstanceBoard.js";

function InstanceTreeBoard() {
  const { classNodes, classEdges } = useClassGraph();
  const { instanceNodes, instanceEdges } = useInstanceGraph();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [filledAttrMap, setFilledAttrMap] = useState({});

  // instanceNodes 바뀔 때는 무조건 반영
  useEffect(() => {
    const {
      nodes: newNodes,
      edges: newEdges,
      filledAttrMap: newFilledAttrMap,
    } = getRenderedInstanceBoard({
      instanceNodes,
      classNodes,
      classEdges,
      //   screenToFlowPosition,
      //   collapsedClassMap,
      filledAttrMap,
    });

    setNodes(newNodes);
    setEdges(newEdges);

    console.log("newNodes", newNodes);
    console.log("newEdges", newEdges);
    setFilledAttrMap(newFilledAttrMap);
  }, [instanceNodes]);

  return (
    <div>
      <InstanceTree nodes={nodes} edges={edges} />
    </div>
  );
}

export default InstanceTreeBoard;
