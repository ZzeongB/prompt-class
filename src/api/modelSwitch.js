
// Model switching removed - always using FLUX
// These functions are kept for backward compatibility but always return FLUX

export const switchModel = async (modelType) => {
  // Always return success with FLUX model
  return {
    message: "Using FLUX model",
    current_model: "flux",
    resolution: "512x512"
  };
};

export const getCurrentModel = async () => {
  // Always return FLUX as current model
  return {
    current_model: "flux",
    available_models: ["flux"]
  };
};