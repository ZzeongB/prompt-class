export async function generateGlobalCaption(sentences) {
  const response = await fetch("http://127.0.0.1:5000/generate-caption", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sentences }),
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
