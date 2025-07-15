// src/context/ClassGraphContext.js
import React, { createContext, useContext, useState } from "react";

const InstanceGraphContext = createContext();

export const InstanceGraphProvider = ({ children }) => {
  const [instanceNodes, setInstanceNodes] = useState([]);
  const [instanceEdges, setInstanceEdges] = useState([]);
  const [instanceAttrMap, setInstanceAttrMap] = useState({});
  const [editedLabelMap, setEditedLabelMap] = useState({});

  return (
    <InstanceGraphContext.Provider value={{ instanceNodes, setInstanceNodes, instanceEdges, setInstanceEdges, instanceAttrMap, setInstanceAttrMap, editedLabelMap, setEditedLabelMap }}>
      {children}
    </InstanceGraphContext.Provider>
  );
};

export const useInstanceGraph = () => useContext(InstanceGraphContext);
