export const OBJ_COLOR = "#FF6B6B";
export const ATTR_COLOR = "#4DABF7";
export const REL_COLOR = "#51CF66";
export const LIGHT_GREY = "#F1F3F5"; // 아주 밝고 은은한 회색 (near-white)
export const DARK_GREY = "#343A40"; // 어두운 회색, 텍스트와도 잘 어울림

export function hexToRGBA(hex, alpha = 0.15) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const OBJ_COLOR_TRANS = hexToRGBA(OBJ_COLOR);
export const ATTR_COLOR_TRANS = hexToRGBA(ATTR_COLOR);
export const REL_COLOR_TRANS = hexToRGBA(REL_COLOR);
export const LIGHT_GREY_TRANS = hexToRGBA(LIGHT_GREY, 0.3); // 투명도 조절 가능
export const DARK_GREY_TRANS = hexToRGBA(DARK_GREY, 0.5);

export const OBJ_COLOR_TRANS_DARK = hexToRGBA(OBJ_COLOR, 0.5);
export const ATTR_COLOR_TRANS_DARK = hexToRGBA(ATTR_COLOR, 0.5);
export const REL_COLOR_TRANS_DARK = hexToRGBA(REL_COLOR, 0.5);

export const BORDER_COLOR = "#1a1a1a";
export const BACKGROUND_COLOR = "#F8F8F8";
export const EDGE_COLOR = "#444";

export const WHITE = "#FAFAF8";
export const BLACK = "#1a1a1a";

export const LEFT_OFFSET = 660; // LayoutBoard에서 왼쪽 여백
export const LEFT_OFFSET_BASELINE = 70;
export const TOP_OFFSET = 40; // LayoutBoard에서 위쪽 여백