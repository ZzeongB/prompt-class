export const convertImageToBase64 = (imagePath) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // 로컬에서는 crossOrigin 필요 없음
    // img.crossOrigin = 'anonymous';  // 이 줄을 제거하세요
    
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
    
    img.onerror = (e) => {
      console.error("Error loading image:", imagePath, e);
      reject(new Error(`Failed to load image: ${imagePath}`));
    };
    
    // 이미지 경로를 콘솔로 출력해 확인
    console.log("Loading image from:", imagePath);
    
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