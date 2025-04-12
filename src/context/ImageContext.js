// src/context/ClassGraphContext.js
import React, { createContext, useContext, useState } from "react";

const ImageContext = createContext();

export const ImageProivder = ({ children }) => {
  const [image, setImage] = useState("");
  const [globalCaption, setGlobalCaption] = useState("");

  return (
    <ImageContext.Provider
      value={{ image, setImage, globalCaption, setGlobalCaption }}
    >
      {children}
    </ImageContext.Provider>
  );
};

export const useImage = () => useContext(ImageContext);
