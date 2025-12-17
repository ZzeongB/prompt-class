import { v4 as uuidv4 } from "uuid";
import { deepCloneSceneGraph } from './SceneGraphUtils';
import { replaceWithSceneGraphPlaceholders } from './PlaceholderUtils';
import { generatePlaceholders } from "../api/generatePlaceholders";
import { logEvent } from "../api/logEvent";
import { generateSceneGraphToText } from "../api/generateTextToGraph";

export const createClass = async (instanceData) => {
  try {
    logEvent("class.create.started", {
      instance_id: instanceData.id,
      instance_label: instanceData.instanceLabel,
      has_scene_graph: !!instanceData.sceneGraph,
      object_count: instanceData.sceneGraph?.objects?.length || 0
    });

    const placeholders = undefined; // await generatePlaceholders(instanceData.sceneGraph);
    const processedSceneGraph = replaceWithSceneGraphPlaceholders(
      instanceData.sceneGraph,
      placeholders
    );

    const newClass = {
      id: `class-${uuidv4()}`,
      name: instanceData.instanceLabel + " Class",
      template: {
        sceneGraph: processedSceneGraph,
        textDescription: instanceData.textDescription,
        instanceLabel: instanceData.instanceLabel,
      },
      createdAt: new Date().toISOString(),
      createdFrom: instanceData.instanceLabel,
      placeholders,
      originalData: {
        sceneGraph: instanceData.sceneGraph,
        textDescription: instanceData.textDescription,
        instanceLabel: instanceData.instanceLabel,
      },
    };

    logEvent("class.created", {
      class_id: newClass.id,
      class_name: newClass.name,
      placeholder_count: Object.keys(placeholders || {}).length,
      created_from: instanceData.instanceLabel
    });

    return { 
      newClass, 
      convertedInstance: createInstanceFromClassData(instanceData, newClass) 
    };

  } catch (error) {
    logEvent("class.create.error", {
      instance_id: instanceData.id,
      error_message: error.message,
      using_fallback: true
    });

    const fallbackClass = {
      id: `class-${uuidv4()}`,
      name: instanceData.instanceLabel + " Class",
      template: {
        sceneGraph: deepCloneSceneGraph(instanceData.sceneGraph),
        textDescription: instanceData.textDescription,
        instanceLabel: instanceData.instanceLabel,
      },
      createdAt: new Date().toISOString(),
      createdFrom: instanceData.instanceLabel,
      originalData: {
        sceneGraph: instanceData.sceneGraph,
        textDescription: instanceData.textDescription,
        instanceLabel: instanceData.instanceLabel,
      },
    };

    logEvent("class.created.fallback", {
      class_id: fallbackClass.id,
      class_name: fallbackClass.name
    });

    return { 
      newClass: fallbackClass, 
      convertedInstance: createInstanceFromClassData(instanceData, fallbackClass) 
    };
  }
};

const createInstanceFromClassData = (instanceData, classData) => {
  return {
    ...instanceData,
    classId: classData.id,
    isFromClass: true,
    createdFrom: classData.name,
    overrides: {},
    originalSceneGraph: instanceData.sceneGraph,
  };
};

export const updateClass = async (classes, classId, updates) => {
  const updatedClasses = await Promise.all(
    classes.map(async (cls) => {
      if (cls.id === classId) {
        let finalUpdates = { ...updates };

        // If scene graph is being updated, regenerate text description
        if (updates.template?.sceneGraph) {
          try {
            const newTextDescription = await generateSceneGraphToText({
              newSceneGraph: updates.template.sceneGraph,
              previousSceneGraph: cls.template?.sceneGraph,
              previousTextDescription: cls.template?.textDescription,
            });

            finalUpdates = {
              ...updates,
              template: {
                ...updates.template,
                textDescription: newTextDescription,
              },
            };
          } catch (error) {
            console.error("Failed to regenerate text description for class:", error);
            // Continue with original updates if generation fails
          }
        }

        return {
          ...cls,
          ...finalUpdates,
          template: {
            ...cls.template,
            ...finalUpdates.template,
          },
        };
      }
      return cls;
    })
  );

  return updatedClasses;
};

export const deleteClass = (classes, instances, classId) => {
  const classToDelete = classes.find((c) => c.id === classId);
  const affectedInstances = instances.filter((instance) => instance.classId === classId);
  
  const updatedClasses = classes.filter((c) => c.id !== classId);
  
  const updatedInstances = instances.map((instance) => {
    if (instance.classId === classId) {
      return {
        ...instance,
        isFromClass: false,
        classId: null,
        overrides: {},
      };
    }
    return instance;
  });

  logEvent("class.deleted", {
    class_id: classId,
    class_name: classToDelete?.name || "Unknown",
    affected_instances_count: affectedInstances.length,
    placeholder_count: classToDelete?.placeholders ? Object.keys(classToDelete.placeholders).length : 0
  });

  return { updatedClasses, updatedInstances };
};