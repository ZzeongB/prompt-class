// src/context/ClassGraphContext.js
import React, { createContext, useContext, useState } from "react";

const InstanceGraphContext = createContext();

export const InstanceGraphProvider = ({ children }) => {
  const [instanceNodes, setInstanceNodes] = useState([]);
  const [instanceEdges, setInstanceEdges] = useState([]);
  const [instanceAttrMap, setInstanceAttrMap] = useState({});

  return (
    <InstanceGraphContext.Provider value={{ instanceNodes, setInstanceNodes, instanceEdges, setInstanceEdges, instanceAttrMap, setInstanceAttrMap }}>
      {children}
    </InstanceGraphContext.Provider>
  );
};

export const useInstanceGraph = () => useContext(InstanceGraphContext);
