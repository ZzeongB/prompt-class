import { Handle, Position, useConnection } from "@xyflow/react";
import { getClassNodeStyle } from "../utils/node/nodeStyleUtils";
import { useDnD } from "../context/DragAndDropContext";

export default function ClassNode({ id, data }) {
  const connection = useConnection();
  const style = getClassNodeStyle(data.type, data); // 💡 type 기반 스타일 적용
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  const label = data.label;


  const [, setId, , setType, , setPosition, , setLabel] = useDnD();

const onDragStart = (e, data) => {
  if (e.target.closest('.classHandle')) {
    return;
  }

  console.log("onDragStart", data);
  setType(data.type);
  setLabel(data.label);  
  setId(id);

  const onMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => {
    console.log("onMouseUp");
    setType(null);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};


  return (
    <div className="nodrag" style={style} onMouseDown={(e) => onDragStart(e, data)}>
        {label}
        {!connection.inProgress && (
          <Handle
            className="classHandle"
            position={Position.Right}
            type="source"
          />
        )}
        {(!connection.inProgress || isTarget) && (
          <Handle
            className="classHandle"
            position={Position.Right}
            type="target"
            isConnectableStart={false}
          />
        )}
    </div>
  );
}
