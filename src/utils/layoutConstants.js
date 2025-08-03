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
  BOUNDING_BOX_BORDER: "3px solid #ff0000",
  BOUNDING_BOX_BACKGROUND: "rgba(255, 0, 0, 0.2)",
  EDGE_STYLES: {
    DEFAULT: {
      stroke: "#cbd5e1",
      strokeWidth: 1.5,
      strokeDasharray: "5,5"
    },
    SOLID: {
      stroke: "#cbd5e1", 
      strokeWidth: 1.5,
      strokeDasharray: "none"
    }
  }
};