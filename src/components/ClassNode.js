import { Handle, Position, useConnection } from "@xyflow/react";
import { getClassNodeStyle } from "../utils/node/nodeStyleUtils";
import { useDnD } from "../context/DragAndDropContext";

export default function ClassNode({ id, data }) {
  const connection = useConnection();
  const style = getClassNodeStyle(data.type, data); // 💡 type 기반 스타일 적용
  const isTarget = connection.inProgress && connection.fromNode.id !== id;
  const label = data.hasValue ? data.hasValue : data.label;
  const [, setId, , setType, , setPosition, , setLabel] = useDnD();

  // 노드 복제를 위한 드래그 시작 핸들러
  const onDragStart = (e, data) => {
    // 드래그 핸들이나 connection 핸들을 클릭한 경우 복제 동작을 하지 않음
    if (e.target.closest(".drag-handle") || e.target.closest(".classHandle")) {
      return;
    }

    console.log("onDragStart for clone", data);
    setType(data.type);
    setLabel(data.label);
    setId(id);

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const onMouseUp = () => {
      console.log("onMouseUp");
      setType(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      style={{
        ...style,
        position: "relative", // 드래그 핸들 위치 지정을 위해
      }}
    >
      {/* 드래그 핸들 - 이 영역은 nodrag 클래스가 없어 드래그 가능 */}
      <div
        className="drag-handle"
        style={{
          cursor: "move",
          position: "absolute",
          // top: "0px",
          left: "-10px",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.3)",
          borderRadius: "0 3px 0 3px",
          zIndex: 10,
        }}
      >
        ⠿
      </div>
      {/* 노드 내용 - nodrag 클래스를 사용하여 이 부분은 드래그 불가능 */}
      <div
        className="nodrag"
        style={{ width: "100%", height: "100%" }}
        onMouseDown={(e) => onDragStart(e, data)}
      >
        {label}

        {/* 연결 핸들 */}
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
    </div>
  );
}
