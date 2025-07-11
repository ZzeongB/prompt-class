export async function generateGlobalCaption(sentences, globalCaption, requiredKeywords) {
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/generate-caption`,{ 
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    mode: "cors", // CORS 모드 명시
    body: JSON.stringify({ "sentences": sentences, "globalCaption": globalCaption, "requiredKeywords": requiredKeywords }),
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
