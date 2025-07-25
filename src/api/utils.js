// API 설정
export const API_CONFIG = {
  endpoint: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
  temperature: 0,
  maxRetries: 3,
  retryDelay: 1000,
};

// 공통 API 호출 함수
export const callOpenAI = async (messages, maxTokens = 1024, retryCount = 0) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const response = await fetch(API_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages,
        temperature: API_CONFIG.temperature,
        max_tokens: maxTokens,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 특정 에러에 대한 더 나은 처리
      if (response.status === 429 && retryCount < API_CONFIG.maxRetries) {
        console.warn(`Rate limit hit, retrying in ${API_CONFIG.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1)));
        return callOpenAI(messages, maxTokens, retryCount + 1);
      }
      
      const errorMessage = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`OpenAI API Error: ${errorMessage}`);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from OpenAI API");
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Network error: Unable to connect to OpenAI API");
    }
    throw error;
  }
};
