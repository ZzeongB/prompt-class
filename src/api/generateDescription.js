import { logEvent } from "./logEvent";

export async function generateDescription(
  base64FullImage,
  crop_box,
  global_caption,
  userId = "P1"
) {
  try {
    logEvent("api.generate_description.started", {
      has_image: !!base64FullImage,
      crop_box_dimensions: crop_box ? [crop_box[2] - crop_box[0], crop_box[3] - crop_box[1]] : null,
      has_global_caption: !!global_caption
    });

    const base64Data = base64FullImage.split(",")[1]; // 👈 "data:image/png;base64," 제거

    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/describe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "cors",
      body: JSON.stringify({
        image: base64Data, // 선택적으로 전체 이미지
        crop_box: crop_box, //[x1, y1, x2, y2],          // 선택 영역
        global_caption: global_caption, // 선택적으로 전체 이미지에 대한 설명
        user_id: userId,
      }),
    });

    if (!response.ok) {
      logEvent("api.generate_description.failed", {
        status: response.status,
        status_text: response.statusText
      });
      throw new Error("Failed to generate description");
    }

    const data = await response.json();
    
    logEvent("api.generate_description.succeeded", {
      label: data.label,
      description_length: data.description?.length || 0
    });
    
    return {
      label: data.label, // 👈 "noun phrase"로 사용
      description: data.description,
    };
  } catch (error) {
    logEvent("api.generate_description.error", {
      error_message: error.message,
      error_type: error.constructor.name
    });
    throw error;
  }
}
