// src/context/ClassGraphContext.js
import React, { createContext, useContext, useState } from "react";

const ClassGraphContext = createContext();

export const ClassGraphProvider = ({ children }) => {
  const [classNodes, setClassNodes] = useState([]);
  const [classEdges, setClassEdges] = useState([]);

  return (
    <ClassGraphContext.Provider value={{ classNodes, setClassNodes, classEdges, setClassEdges }}>
      {children}
    </ClassGraphContext.Provider>
  );
};

export const useClassGraph = () => useContext(ClassGraphContext);
