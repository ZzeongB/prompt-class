// First set of questions - for target 1
export const evaluationQuestionsSetA = [
  { "id": 1, "category": "attribute", "question": "Is the elderly man wearing a black beret?" },
  { "id": 2, "category": "attribute", "question": "Is the elderly man wearing a light gray cardigan?" },
  { "id": 3, "category": "attribute", "question": "Is the elderly man wearing dark pants?" },
  { "id": 4, "category": "attribute", "question": "Is the elderly man wearing black shoes?" },
  { "id": 5, "category": "attribute", "question": "Is the woman wearing a white dress with a pink-and-blue floral pattern?" },
  { "id": 6, "category": "attribute", "question": "Is the woman wearing white sandals?" },
  { "id": 7, "category": "relation", "question": "Is the woman carrying a straw basket?" },
  { "id": 8, "category": "attribute", "question": "Is the man wearing a bright blue polo shirt?" },
  { "id": 9, "category": "attribute", "question": "Is the man wearing beige shorts?" },
  { "id": 10, "category": "attribute", "question": "Is the man wearing black sandals?" },
  { "id": 11, "category": "attribute", "question": "Is the man carrying a straw basket with the woman?" },
  { "id": 12, "category": "relation", "question": "Is the man holding a large tray filled with bottled water?" },
  { "id": 13, "category": "attribute", "question": "Is the girl wearing a pink sleeveless top?" },
  { "id": 14, "category": "attribute", "question": "Is the girl wearing a white skirt?" },
  { "id": 15, "category": "attribute", "question": "Is the girl wearing pink shoes?" },
  { "id": 16, "category": "relation", "question": "Is the girl holding a yellow balloon in her right hand?" },
  { "id": 17, "category": "relation", "question": "Is the girl carrying a brown teddy bear by its arm?" },
  // { "id": 5, "category": "relation", "question": "Does the elderly man appear slightly shorter than the others?" }, //
  // { "id": 6, "category": "attribute", "question": "Does the woman have long black hair?" }, // 
  // { "id": 19, "category": "relation", "question": "Is the child with the balloon positioned on the right side?" }, //
  // { "id": 20, "category": "context", "question": "Are there cars parked in the background?" }, //
  // { "id": 21, "category": "context", "question": "Is the scene outdoors on a street?" } //
];

export const evaluationQuestionsSetB = [
  { id: 1, category: "attribute", question: "Is the man wearing a white shirt?" },
  { id: 2, category: "attribute", question: "Is he wearing beige trousers?" },
  { id: 3, category: "attribute", question: "Is he wearing black shoes?" },
  { id: 4, category: "attribute", question: "Is he wearing sunglasses?" },
  { id: 5, category: "relation",  question: "Is he holding a map?" },

  { id: 6, category: "attribute", question: "Is the woman wearing a floral-patterned T-shirt?" },
  { id: 7, category: "attribute", question: "Is she wearing denim shorts?" },
  { id: 8, category: "attribute", question: "Is she wearing sandals?" },
  { id: 9, category: "relation",  question: "Is she carrying a suitcase?" },
  { id: 10, category: "relation", question: "Is she carrying a coffee cup?" },

  { id: 11, category: "attribute", question: "Is the other man wearing a bright green T-shirt?" },
  { id: 12, category: "attribute", question: "Is he wearing beige shorts?" },
  { id: 13, category: "attribute", question: "Is he wearing black sandals?" },
  { id: 14, category: "relation",  question: "Is he standing with his hands in his pockets?" },

  { id: 15, category: "attribute", question: "Is the other woman wearing a sky-blue summer dress?" },
  { id: 16, category: "attribute", question: "Is she wearing brown sandals?" },
  { id: 17, category: "relation",  question: "Is she holding a straw hat in one hand?" },
  { id: 18, category: "relation",  question: "Is she raising a small camera to take a photo?" }
];


// Default export for backward compatibility - will be determined by scene ID
export const evaluationQuestions = evaluationQuestionsSetA;

export const responseOptions = [
  { value: "yes", label: "Yes", color: "#22c55e" },
  { value: "no", label: "No", color: "#ef4444" },
  { value: "unknown", label: "Don't Know", color: "#6b7280" }
];