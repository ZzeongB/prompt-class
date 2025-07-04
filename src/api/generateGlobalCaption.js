export async function generateGlobalCaption(sentences, globalCaption) {
  const response = await fetch("http://127.0.0.1:5000/generate-caption", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    mode: "cors", // CORS 모드 명시
    body: JSON.stringify({ "sentences": sentences, "globalCaption": globalCaption }),
  });

  if (!response.ok) {
    throw new Error("Error generating global caption");
  }

  const data = await response.json();
  return {
    refinedCaptions: data.refined_captions,
    globalCaption: data.global_caption,
  };
}
