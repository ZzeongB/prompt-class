export const detectObjects = async (imageBase64) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/detect-objects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.objects || [];
  } catch (error) {
    console.error('Error detecting objects:', error);
    throw error;
  }
};