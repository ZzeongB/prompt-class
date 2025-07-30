
export const switchModel = async (modelType) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/switch-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_type: modelType
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error switching model:', error);
    throw error;
  }
};

export const getCurrentModel = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/current-model`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting current model:', error);
    throw error;
  }
};