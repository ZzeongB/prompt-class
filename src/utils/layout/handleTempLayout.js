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

    const newNode = {
      id: `resizable-${nodes.length + 1}`,
      type: "tmpResizable",
      position: topLeft,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
      data: { type: "object", label: "New Object", showToolbar: true },
    };

    setNodes((nds) => [...nds, newNode]);
  }

  // 끝났으면 초기화
  setDragState(null);
}
