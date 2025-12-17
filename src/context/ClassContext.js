import React, { createContext, useContext, useState } from "react";
import * as ClassOps from '../utils/ClassOperations';
import * as InstanceOps from '../utils/InstanceOperations';
import { deepCloneSceneGraph } from '../utils/SceneGraphUtils';

const ClassContext = createContext();


export const useClassContext = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error("useClassContext must be used within a ClassProvider");
  }
  return context;
};

export const ClassProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [instances, setInstances] = useState([]);
  const [savedScenes, setSavedScenes] = useState({});


  const createClass = async (instanceData) => {
    const { newClass, convertedInstance } = await ClassOps.createClass(instanceData);
    
    setClasses((prev) => [...prev, newClass]);
    setInstances((prev) =>
      prev.map((instance) => {
        if (instance.id === instanceData.id) {
          return convertedInstance;
        }
        return instance;
      })
    );

    return newClass;
  };

  const createInstanceFromClass = async (classData, newValues = {}) => {
    const newInstance = await InstanceOps.createInstanceFromClass(classData, newValues);
    setInstances((prev) => [...prev, newInstance]);
    return newInstance;
  };

  const updateClass = async (classId, updates) => {
    console.log('[ClassContext] updateClass called:', classId, updates);

    // Get current classes to pass to async operation
    const currentClasses = classes;
    const updatedClasses = await ClassOps.updateClass(currentClasses, classId, updates);
    const updatedClass = updatedClasses.find(cls => cls.id === classId);

    console.log('[ClassContext] Updated class:', updatedClass);

    setClasses(updatedClasses);

    if (updatedClass) {
      console.log('[ClassContext] Calling updateInstancesFromClass');
      updateInstancesFromClass(updatedClass);
    }
  };


  const updateInstance = (instanceId, updates) => {
    setInstances((prev) =>
      prev.map((instance) => {
        if (instance.id === instanceId) {
          return InstanceOps.updateInstanceWithOverrides(instance, updates, classes);
        }
        return instance;
      })
    );
  };

  const resetInstanceToClass = (instanceId) => {
    setInstances((prev) =>
      prev.map((instance) => {
        if (instance.id === instanceId) {
          return InstanceOps.resetInstanceToClass(instance, classes);
        }
        return instance;
      })
    );
  };

  const updateInstancesFromClass = async (updatedClass) => {
    console.log('[ClassContext] updateInstancesFromClass called for class:', updatedClass.id);
    console.log('[ClassContext] Current instances:', instances);
    const updatedInstances = await InstanceOps.updateInstancesFromClassTemplate(updatedClass, instances);
    console.log('[ClassContext] Updated instances from InstanceOps:', updatedInstances);

    setInstances((prev) => {
      const newInstances = prev.map((instance) => {
        const updated = updatedInstances.find((u) => u.id === instance.id);
        if (updated) {
          console.log(`[ClassContext] Updating instance ${instance.id}`);
        }
        return updated || instance;
      });
      console.log('[ClassContext] New instances state:', newInstances);
      return newInstances;
    });
  };


  const duplicateInstance = (instanceData) => {
    const duplicated = InstanceOps.duplicateInstance(instanceData);
    setInstances((prev) => [...prev, duplicated]);
    return duplicated;
  };

  const deleteClass = (classId) => {
    const { updatedClasses, updatedInstances } = ClassOps.deleteClass(classes, instances, classId);
    setClasses(updatedClasses);
    setInstances(updatedInstances);
  };

  const extractObjectFromInstance = async (objectId, instanceId) => {
    const sourceInstance = instances.find(inst => inst.id === instanceId);
    try {
      const { newInstance, updatedSourceInstance } = await InstanceOps.extractObjectFromInstance(objectId, sourceInstance);
      
      setInstances((prev) => [
        ...prev.filter(inst => inst.id !== instanceId),
        updatedSourceInstance,
        newInstance
      ]);
      
      return newInstance;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  };

  const deleteInstance = (instanceId) => {
    setInstances((prev) => prev.filter((i) => i.id !== instanceId));
  };

  const saveScene = (slotNumber, sceneData) => {
    setSavedScenes(prev => ({
      ...prev,
      [slotNumber]: {
        ...sceneData,
        savedAt: new Date().toISOString()
      }
    }));
  };

  const loadScene = (slotNumber) => {
    return savedScenes[slotNumber] || null;
  };

  const clearScene = (slotNumber) => {
    setSavedScenes(prev => {
      const newScenes = { ...prev };
      delete newScenes[slotNumber];
      return newScenes;
    });
  };

  const contextValue = {
    classes,
    instances,
    savedScenes,
    createClass,
    updateClass,
    deleteClass,
    createInstanceFromClass,
    updateInstance,
    resetInstanceToClass,
    duplicateInstance,
    extractObjectFromInstance,
    deleteInstance,
    setInstances,
    saveScene,
    loadScene,
    clearScene,
    onInstanceExtracted: null, // 콜백을 위한 플레이스홀더
  };

  return (
    <ClassContext.Provider value={contextValue}>
      {children}
    </ClassContext.Provider>
  );
};
