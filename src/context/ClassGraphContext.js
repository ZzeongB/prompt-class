// src/context/ClassGraphContext.js
import React, { createContext, useContext, useState } from "react";

const ClassGraphContext = createContext();

export function ClassGraphProvider({ children }) {
  const [classNodes, setClassNodes] = useState([]);
  const [classEdges, setClassEdges] = useState([]);
  const [structuredClasses, setStructuredClasses] = useState([]);
  const [setNodesFromFlow, setSetNodesFromFlow] = useState(() => () => {});

  return (
    <ClassGraphContext.Provider
      value={{
        classNodes,
        classEdges,
        setClassNodes,
        setClassEdges,
        structuredClasses,
        setStructuredClasses,
        setNodesFromFlow,
        registerSetNodes: (fn) => setSetNodesFromFlow(() => fn), // ✅
      }}
    >
      {children}
    </ClassGraphContext.Provider>
  );
}

export const useClassGraph = () => useContext(ClassGraphContext);
