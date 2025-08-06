// 이미지를 base64로 변환하는 유틸리티
export const convertImageToBase64 = (imagePath) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      try {
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imagePath}`));
    };
    
    img.src = imagePath;
  });
};

// 미리 정의된 베이스 이미지들을 로드하는 함수
export const loadBaseImages = async () => {
  try {
    const [tomato, car, player, woman ] = await Promise.all([
      convertImageToBase64('/assets/base-images/tomato.png'),
      convertImageToBase64('/assets/base-images/car.png'),
      convertImageToBase64('/assets/base-images/player.png'),
      convertImageToBase64('/assets/base-images/woman.png')
    ]);
    
    return {
      tomato,
      car,
      player,
      woman
    };
  } catch (error) {
    console.error('Failed to load base images:', error);
    return {
      tomato: null,
      car: null,
      player: null,
      woman: null
    };
  }
};