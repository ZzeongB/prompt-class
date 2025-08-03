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
  const updateClass = (classId, updates) => {
    setClasses((prev) => {
      const updatedClasses = ClassOps.updateClass(prev, classId, updates);
      const updatedClass = updatedClasses.find(cls => cls.id === classId);
      if (updatedClass) {
        updateInstancesFromClass(updatedClass);
      }
      return updatedClasses;
    });
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
    const updatedInstances = await InstanceOps.updateInstancesFromClassTemplate(updatedClass, instances);
    
    setInstances((prev) =>
      prev.map((instance) => {
        const updated = updatedInstances.find((u) => u.id === instance.id);
        return updated || instance;
      })
    );
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

  const extractObjectFromInstance = (objectId, instanceId) => {
    const sourceInstance = instances.find(inst => inst.id === instanceId);
    try {
      const { newInstance, updatedSourceInstance } = InstanceOps.extractObjectFromInstance(objectId, sourceInstance);
      
      setInstances((prev) => [
        ...prev.filter(inst => inst.id !== instanceId),
        updatedSourceInstance,
        newInstance
      ]);
      
      console.log(`Extracted object from instance "${sourceInstance.instanceLabel}"`);
      console.log(`Created new instance: "${newInstance.instanceLabel}"`);
      
      return newInstance;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  };

  const deleteInstance = (instanceId) => {
    setInstances((prev) => prev.filter((i) => i.id !== instanceId));
  };

  const contextValue = {
    classes,
    instances,
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
    onInstanceExtracted: null, // 콜백을 위한 플레이스홀더
  };

  return (
    <ClassContext.Provider value={contextValue}>
      {children}
    </ClassContext.Provider>
  );
};
