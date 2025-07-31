import { generateGlobalCaption } from "./generateGlobalCaption";
import { logEvent } from "./logEvent";

export async function generateImageFromInstanceData(
  sentences,
  boxes,
  globalCaption_,
  requiredKeywords
) {
  try {
    logEvent("api.generate_image.started", {
      sentence_count: sentences?.length || 0,
      box_count: boxes?.length || 0,
      has_global_caption: !!globalCaption_,
      has_required_keywords: !!requiredKeywords,
    });

    const { refinedCaptions, globalCaption } = await generateGlobalCaption(
      sentences,
      globalCaption_,
      requiredKeywords || null
    );

    if (!refinedCaptions || refinedCaptions.length === 0) {
      console.warn("No refined captions generated, using original sentences.");
      logEvent("api.generate_image.caption_fallback", {
        original_sentences: sentences,
      });
    }

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
          region_caption_list: refinedCaptions || sentences,
          region_bboxes_list: boxes,
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
      region_count: (refinedCaptions || sentences)?.length || 0,
      has_image: !!data.image,
      detected_objects_count: data.detectedObjects?.length || 0,
    });

    return {
      image: `data:image/png;base64,${data.image}`,
      globalCaption: globalCaption,
      refinedCaptions: refinedCaptions || [],
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
