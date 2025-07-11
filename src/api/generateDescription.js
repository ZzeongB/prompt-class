export async function generateDescription(
  base64FullImage,
  crop_box,
  global_caption
) {
  const base64Data = base64FullImage.split(",")[1]; // 👈 "data:image/png;base64," 제거

  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/describe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
    body: JSON.stringify({
      image: base64Data, // 선택적으로 전체 이미지
      crop_box: crop_box, //[x1, y1, x2, y2],          // 선택 영역
      global_caption: global_caption, // 선택적으로 전체 이미지에 대한 설명
    }),
  });

  const data = await response.json();
  return {
    label: data.label, // 👈 "noun phrase"로 사용
    description: data.description,
  };
}
