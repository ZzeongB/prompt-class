import React from "react";

const ImageDisplay = ({ imageBoard, currentModel }) => {
  if (!imageBoard) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "512px",
        position: "relative",
      }}
    >
      <img
        src={imageBoard}
        alt="Generated"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          objectFit: "contain",
        }}
      />

      {/* <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "white",
          padding: "3px 8px",
          borderRadius: "10px",
          fontSize: "11px",
          zIndex: 15,
        }}
      >
        {currentModel.toUpperCase()}
      </div> */}
    </div>
  );
};

export default ImageDisplay;