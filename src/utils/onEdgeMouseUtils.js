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
