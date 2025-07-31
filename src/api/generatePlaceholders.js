import { all } from 'axios';
import { callOpenAI } from './utils'; // 기존 callOpenAI 함수를 import
import { logEvent } from './logEvent';

// SceneGraph에서 objectId별로 텍스트 값들을 추출하는 함수
const extractValuesFromSceneGraph = (sceneGraph) => {
  const objectMappings = {};
  
  // Objects에서 이름과 속성들 추출
  if (sceneGraph.objects && Array.isArray(sceneGraph.objects)) {
    sceneGraph.objects.forEach(obj => {
      objectMappings[obj.id] = {
        name: obj.name || null,
        attributes: (obj.attributes || []).filter(attr => typeof attr === 'string')
      };
    });
  }
  
  return objectMappings;
};

// GPT를 이용해서 값들을 카테고리로 변환
export const generatePlaceholders = async (sceneGraph) => {
  if (!sceneGraph) {
    throw new Error("Valid tree data is required");
  }

  logEvent("api.generate_placeholders.started", {
    has_objects: !!(sceneGraph.objects && sceneGraph.objects.length > 0),
    has_relationships: !!(sceneGraph.relationships && sceneGraph.relationships.length > 0),
    object_count: sceneGraph.objects?.length || 0,
    relationship_count: sceneGraph.relationships?.length || 0
  });

  // objectId별로 텍스트 값들을 추출
  const objectMappings = extractValuesFromSceneGraph(sceneGraph);
  
  if (Object.keys(objectMappings).length === 0) {
    logEvent("api.generate_placeholders.no_values", {});
    return {};
  }

  // 모든 고유 값들을 수집
  const allValues = new Set();
  Object.values(objectMappings).forEach(obj => {
    if (obj.name) allValues.add(obj.name);
    obj.attributes.forEach(attr => allValues.add(attr));
  });
  
  const uniqueValues = Array.from(allValues);

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
    
    const rawCategoryMap = JSON.parse(cleanContent);
    
    // 유효성 검증
    if (typeof rawCategoryMap !== 'object' || rawCategoryMap === null) {
      throw new Error("Invalid placeholder map structure");
    }
    
    // objectId별로 placeholders 구성 - 간단한 구조
    const placeholderMap = {};
    
    Object.entries(objectMappings).forEach(([objectId, data]) => {
      placeholderMap[objectId] = {
        name: data.name ? {
          name: rawCategoryMap[data.name] || 'unknown',
          defaultvalue: data.name
        } : null,
        attr: data.attributes.map(attr => ({
          name: rawCategoryMap[attr] || 'unknown',
          defaultvalue: attr
        }))
      };
    });
    
    console.log(`🎯 Generated placeholderMap:`, placeholderMap);
    
    logEvent("api.generate_placeholders.succeeded", {
      object_count: Object.keys(placeholderMap).length,
      unique_value_count: uniqueValues.length
    });
    
    return placeholderMap;
    
  } catch (error) {
    console.error("generatePlaceholders Error:", error);
    
    logEvent("api.generate_placeholders.error", {
      error_message: error.message,
      error_type: error.constructor.name,
      object_count: Object.keys(objectMappings).length
    });
    
    // fallback: objectId별로 기본 매핑 - 간단한 구조
    const fallbackMap = {};
    Object.entries(objectMappings).forEach(([objectId, data]) => {
      fallbackMap[objectId] = {
        name: data.name ? {
          name: 'value',
          defaultvalue: data.name
        } : null,
        attr: data.attributes.map(attr => ({
          name: 'value',
          defaultvalue: attr
        }))
      };
    });
    
    logEvent("api.generate_placeholders.fallback", {
      fallback_count: Object.keys(fallbackMap).length
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