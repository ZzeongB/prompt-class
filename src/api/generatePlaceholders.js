import { callOpenAI } from './utils'; // 기존 callOpenAI 함수를 import

// 트리에서 모든 텍스트 값들을 추출하는 함수
const extractValuesFromTree = (node) => {
  const values = [];
  
  if (node.data?.label && typeof node.data.label === 'string') {
    values.push(node.data.label);
  }
  
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => {
      values.push(...extractValuesFromTree(child));
    });
  }
  
  return values;
};

// GPT를 이용해서 값들을 카테고리로 변환
export const generatePlaceholders = async (treeData) => {
  if (!treeData) {
    throw new Error("Valid tree data is required");
  }

  // 트리에서 모든 텍스트 값들을 추출
  const allValues = extractValuesFromTree(treeData);
  const uniqueValues = [...new Set(allValues)].filter(value => value.trim() !== '');
  
  if (uniqueValues.length === 0) {
    return {};
  }

  const systemPrompt = `
다음 값들을 보고, 각각을 적절한 일반적인 카테고리로 변환해주세요.

예시:
- "apple" -> "fruit"
- "red" -> "color" 
- "10cm" -> "size"
- "김철수" -> "name"
- "running" -> "action"
- "happy" -> "emotion"

값들: ${uniqueValues.join(', ')}

응답은 반드시 JSON 형태로만 해주세요. 각 원본 값을 키로, 카테고리를 값으로 하는 객체:
{"original_value": "category_label"}

JSON만 응답하세요:`;

  try {
    const content = await callOpenAI([{ role: "user", content: systemPrompt }], 512);
    
    // JSON 파싱 (코드 블록 제거)
    let cleanContent = content;
    if (cleanContent.includes('```')) {
      cleanContent = cleanContent.replace(/```(?:json)?\n?/g, "").replace(/```$/g, "").trim();
    }
    
    const placeholderMap = JSON.parse(cleanContent);
    
    // 유효성 검증
    if (typeof placeholderMap !== 'object' || placeholderMap === null) {
      throw new Error("Invalid placeholder map structure");
    }
    
    return placeholderMap;
    
  } catch (error) {
    console.error("generatePlaceholders Error:", error);
    
    // fallback: 모든 값을 "value"로 매핑
    const fallbackMap = {};
    uniqueValues.forEach(value => {
      fallbackMap[value] = 'value';
    });
    
    console.warn("Using fallback placeholder mapping");
    return fallbackMap;
  }
};

// GPT를 이용해서 placeholder 값들을 제안받는 함수
export const suggestPlaceholderValues = async (placeholders) => {
  if (!placeholders || Object.keys(placeholders).length === 0) {
    return {};
  }
  
  const categories = Object.values(placeholders);
  const uniqueCategories = [...new Set(categories)];
  
  const systemPrompt = `
다음 카테고리들에 대해 각각 3개씩 예시 값을 제안해주세요.

카테고리들: ${uniqueCategories.join(', ')}

응답은 JSON 형태로 해주세요:
{
  "fruit": ["apple", "orange", "banana"],
  "color": ["red", "blue", "green"],
  "size": ["small", "medium", "large"]
}

JSON만 응답하세요:`;

  try {
    const content = await callOpenAI([{ role: "user", content: systemPrompt }], 512);
    
    let cleanContent = content;
    if (cleanContent.includes('```')) {
      cleanContent = cleanContent.replace(/```(?:json)?\n?/g, "").replace(/```$/g, "").trim();
    }
    
    return JSON.parse(cleanContent);
    
  } catch (error) {
    console.error("suggestPlaceholderValues Error:", error);
    
    // fallback 제안
    const fallback = {};
    uniqueCategories.forEach(category => {
      switch(category) {
        case 'fruit':
          fallback[category] = ['apple', 'orange', 'banana'];
          break;
        case 'color':
          fallback[category] = ['red', 'blue', 'green'];
          break;
        case 'size':
          fallback[category] = ['small', 'medium', 'large'];
          break;
        case 'emotion':
          fallback[category] = ['happy', 'sad', 'excited'];
          break;
        case 'action':
          fallback[category] = ['running', 'jumping', 'sitting'];
          break;
        case 'name':
          fallback[category] = ['John', 'Mary', 'Alex'];
          break;
        default:
          fallback[category] = ['option1', 'option2', 'option3'];
      }
    });
    
    return fallback;
  }
};