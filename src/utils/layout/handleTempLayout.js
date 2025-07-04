import { v4 as uuidv4 } from "uuid";

export function handleMouseDown(e, setDragState) {
  if (e.button !== 0) return;

  setDragState({
    start: { x: e.clientX, y: e.clientY },
    rect: null,
  });
}

export function handleMouseMove(e, dragState, setDragState) {
  if (!dragState?.start) return;

  const { start } = dragState;
  const x = Math.min(start.x, e.clientX);
  const y = Math.min(start.y, e.clientY);
  const width = Math.abs(e.clientX - start.x);
  const height = Math.abs(e.clientY - start.y);

  setDragState({
    start,
    rect: { x, y, width, height },
  });
}

export function handleMouseUp(
  dragState,
  setDragState,
  screenToFlowPosition,
  nodes,
  setNodes
) {
  if (dragState?.rect) {
    const { rect } = dragState;
    const topLeft = screenToFlowPosition({ x: rect.x, y: rect.y });
    const bottomRight = screenToFlowPosition({
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    });

    const uniqueId = uuidv4();

    const newNode = {
      id: `resizable-${uniqueId}`,
      type: "tmpResizable",
      position: topLeft,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
      data: { type: "empty", label: "New Object", showToolbar: true, sharedId: `resizable-${uniqueId}` },
    };

    setNodes((nds) => [...nds, newNode]);
  }

  // 끝났으면 초기화
  setDragState(null);
}
