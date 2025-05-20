export const OBJ_COLOR = "#FF6B6B";
export const ATTR_COLOR = "#4DABF7";
export const REL_COLOR = "#51CF66";


function hexToRGBA(hex, alpha = 0.2) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const OBJ_COLOR_TRANS = hexToRGBA(OBJ_COLOR);
export const ATTR_COLOR_TRANS = hexToRGBA(ATTR_COLOR);
export const REL_COLOR_TRANS = hexToRGBA(REL_COLOR);

export const BORDER_COLOR = "#1a1a1a";
export const BACKGROUND_COLOR = "#F8F8F8";
export const EDGE_COLOR = "#1a1a1a";

export const WHITE = "#FAFAF8";
export const BLACK = "#1a1a1a";
