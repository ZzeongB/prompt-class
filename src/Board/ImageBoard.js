function ImageBoard({ imageSrc }) {
  return (
    <div>
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Generated layout"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain", // ✅ 비율 유지 + 잘리지 않음 (빈 여백 생길 수 있음)
          }}
        />
      )}
    </div>
  );
}

export default ImageBoard;
