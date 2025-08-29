export const evaluationQuestions = [
  {
    id: 1,
    category: "Layout Quality",
    question: "Are the object placements spatially logical and realistic?",
    description: "Evaluate whether objects are positioned in ways that make sense in real-world contexts"
  },
  {
    id: 2,
    category: "Layout Quality", 
    question: "Do the bounding boxes accurately represent object boundaries?",
    description: "Check if the bounding boxes properly encompass the intended objects without significant overlap or gaps"
  },
  {
    id: 3,
    category: "Scene Coherence",
    question: "Does the overall scene composition make logical sense?",
    description: "Assess whether all elements work together to create a believable scene"
  },
  {
    id: 4,
    category: "Scene Coherence",
    question: "Are the object relationships (spatial, semantic) appropriate?",
    description: "Evaluate whether objects relate to each other in meaningful and realistic ways"
  },
  {
    id: 5,
    category: "Prompt Accuracy",
    question: "Do the text descriptions accurately reflect the intended objects?",
    description: "Check if the written descriptions match what the objects are supposed to represent"
  },
  {
    id: 6,
    category: "Prompt Accuracy",
    question: "Is the global caption representative of the overall scene?",
    description: "Assess whether the global caption captures the essence and context of the entire scene"
  },
  {
    id: 7,
    category: "Visual Quality",
    question: "Are object sizes proportionally reasonable?",
    description: "Evaluate whether objects are sized appropriately relative to each other and the scene context"
  },
  {
    id: 8,
    category: "Visual Quality",
    question: "Is there good use of available space without overcrowding?",
    description: "Check if the layout makes efficient use of space while maintaining visual clarity"
  },
  {
    id: 9,
    category: "Completeness",
    question: "Are all essential elements for the scene type included?",
    description: "Assess whether the scene contains the necessary objects to be considered complete"
  },
  {
    id: 10,
    category: "Completeness",
    question: "Is the scene graph information comprehensive and accurate?",
    description: "Evaluate whether the relationship data fully captures the spatial and semantic connections"
  }
];

export const responseOptions = [
  { value: "yes", label: "Yes", color: "#22c55e" },
  { value: "no", label: "No", color: "#ef4444" },
  { value: "unknown", label: "Don't Know", color: "#6b7280" }
];