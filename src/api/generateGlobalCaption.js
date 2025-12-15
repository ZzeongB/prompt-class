export async function generateGlobalCaption(sentences, globalCaption, requiredKeywords, userId = "P1") {
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/generate-caption`,{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    mode: "cors", // CORS 모드 명시
    body: JSON.stringify({ "sentences": sentences, "globalCaption": globalCaption, "requiredKeywords": requiredKeywords, "user_id": userId }),
  });

  if (!response.ok) {
    throw new Error("Error generating global caption");
  }

  const data = await response.json();
  // Note: Backend no longer returns refined_captions, user's original sentences are used as-is
  return {
    globalCaption: data.global_caption,
  };
}
