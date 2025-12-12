export const LAYOUT_CONFIG = {
  SCALE_FACTOR: 1,
  MAX_NODES: 10,
  DEFAULT_NODE_SIZE: { width: 50, height: 50 },
  DEFAULT_POSITION: { x: 50, y: 50 },
  OVERLAP_THRESHOLD: 0.3,
  CANVAS_SIZE: 512,
  NODE_BOUNDS: { left: 0, top: 0, right: 512, bottom: 512 }
};

export const UI_CONFIG = {
  GHOST_NODE_OPACITY: 0.9,
  BOUNDING_BOX_BORDER: "2px solid #ff0000",
  BOUNDING_BOX_BACKGROUND: "rgba(255, 0, 0, 0.05)",
  EDGE_STYLES: {
    DEFAULT: {
      stroke: "#64748b",
      strokeWidth: 2,
      strokeDasharray: "none",},
    SOLID: {
      stroke: "#64748b", 
      strokeWidth: 1.5,
      strokeDasharray: "none"
    }
  }
};