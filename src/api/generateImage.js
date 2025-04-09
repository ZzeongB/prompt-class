import axios from "axios";

export async function generateImageFromInstanceData(sentences, boxes) {
  try {
    const response = await fetch("http://127.0.0.1:5000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors", // CORS 모드 명시
      body: JSON.stringify({
        sentences: sentences,
        boxes: boxes,
      }),
    });

    if (!response.ok) {
      throw new Error("Error generating image");
    }

    // 응답 JSON으로 파싱
    const data = await response.json();
    console.log("data", data);
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}
