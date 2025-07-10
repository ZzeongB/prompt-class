export const onEdgeMouseEnter = (event, edge, setEdges) => {
  const edgeId = edge.id;

  // Updates edge
  setEdges((prevElements) =>
    prevElements.map((element) =>
      element.id === edgeId
        ? {
            ...element,

            data: {
              ...element.data,
              isHovered: true,
            },
          }
        : element
    )
  );
};

export const onEdgeMouseLeave = (event, edge, setEdges) => {
  const edgeId = edge.id;

  // Updates edge
  setEdges((prevElements) =>
    prevElements.map((element) =>
      element.id === edgeId
        ? {
            ...element,

            data: {
              ...element.data,
              isHovered: false,
            },
          }
        : element
    )
  );
};

export const onEdgeClick = (event, edge, setEdges) => {
  event.stopPropagation(); // ✅ 다른 노드/보드 클릭 무시
  const edgeId = edge.id;

  setEdges((prev) =>
    prev.map(
      (e) =>
        e.id === edgeId
          ? {
              ...e,
              data: {
                ...(e.data || {}),
                isHovered : !(e.data?.isHovered ?? false),
              },
            }
          : { ...e, data: { ...(e.data || {}), isHovered: false } } // ✅ 다른 edge들은 비활성화
    )
  );
};
