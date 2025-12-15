import { generateGlobalCaption } from "./generateGlobalCaption";
import { logEvent } from "./logEvent";

export async function generateImageFromInstanceData(
  sentences,
  boxes,
  globalCaption_,
  requiredKeywords,
  userId = "P1"
) {
  try {
    logEvent("api.generate_image.started", {
      sentence_count: sentences?.length || 0,
      box_count: boxes?.length || 0,
      has_global_caption: !!globalCaption_,
      has_required_keywords: !!requiredKeywords,
    });

    // Get only the global caption - user's sentences are used as-is for regions
    const { globalCaption } = await generateGlobalCaption(
      sentences,
      globalCaption_,
      requiredKeywords || null,
      userId
    );

    logEvent("api.generate_image.caption_generated", {
      global_caption: globalCaption,
      region_sentences: sentences,
    });

    const response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors", // CORS 모드 명시
        body: JSON.stringify({
          global_caption: globalCaption,
          region_caption_list: sentences, // Use user's original sentences directly
          region_bboxes_list: boxes,
          user_id: userId,
        }),
      }
    );

    if (!response.ok) {
      logEvent("api.generate_image.failed", {
        status: response.status,
        status_text: response.statusText,
      });
      throw new Error("Error generating image");
    }

    // 응답 JSON으로 파싱
    const data = await response.json();

    logEvent("api.generate_image.succeeded", {
      global_caption: globalCaption,
      has_image: !!data.image,
      detected_objects_count: data.detectedObjects?.length || 0,
      image_path: data.imagePath,
      image_with_layout_path: data.imageWithLayoutPath,
      timestamp_dir: data.timestampDir,
    });

    return {
      image: `data:image/png;base64,${data.image}`,
      globalCaption: globalCaption,
      detectedObjects: data.detectedObjects || [],
    };
  } catch (error) {
    console.error("Error generating image:", error);
    logEvent("api.generate_image.error", {
      error_message: error.message,
      error_type: error.constructor.name,
    });
    throw error;
  }
}
