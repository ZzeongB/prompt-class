import React, { createContext, useContext, useState } from 'react';

const DnDContext = createContext([null, () => {}, { x: 0, y: 0 }, () => {}]);

export const DnDProvider = ({ children }) => {
  const [type, setType] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [label, setLabel] = useState(null);
  const [id, setId] = useState(null);

  return (
    <DnDContext.Provider value={[id, setId, type, setType, position, setPosition, label, setLabel]}>
      {children}
    </DnDContext.Provider>
  );
};

export const useDnD = () => useContext(DnDContext);
