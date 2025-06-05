import { generateGlobalCaption } from "./generateGlobalCaption";

export async function generateImageFromInstanceData(sentences, boxes, globalCaption_) {
  try {
    console.log("generateImageFromInstanceData")
    const { refinedCaptions, globalCaption } = await generateGlobalCaption(sentences, globalCaption_);
    console.log("refinedCaptions", refinedCaptions);
    console.log("globalCaption", globalCaption);
    console.log("region_bboxes_list", boxes);

    const response = await fetch("http://127.0.0.1:5000/generate", {
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
    });

    if (!response.ok) {
      throw new Error("Error generating image");
    }

    // 응답 JSON으로 파싱
    const data = await response.json();
    return {
      image: `data:image/png;base64,${data.image}`,
      globalCaption: globalCaption,
    };
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}
