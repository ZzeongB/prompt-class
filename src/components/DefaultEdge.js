import { getStraightPath, useInternalNode } from '@xyflow/react';
import { getEdgeParams } from '../utils/nodePositionUtils';
import { EDGE_COLOR } from '../utils/constants';

function DefaultEdge({ id, source, target, markerEnd, style }) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
 
  if (!sourceNode || !targetNode) {
    return null;
  }
 
  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
 
  const [edgePath] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });
 
  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
      style={{ ...style, stroke: EDGE_COLOR }}
    />
  );
}
 
export default DefaultEdge;