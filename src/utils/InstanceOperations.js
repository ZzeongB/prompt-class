import { v4 as uuidv4 } from "uuid";
import { 
  deepCloneSceneGraph, 
  generateSceneGraphTextDescription 
} from './SceneGraphUtils';
import { resolvePlaceholdersInSceneGraph } from './PlaceholderUtils';
import { 
  calculateInstanceOverrides, 
  applyClassUpdatesToInstance,
  resetInstanceOverrides 
} from './OverrideUtils';
import { logEvent } from "../api/logEvent";

export const generateInstanceLabel = (values) => {
  const mainValue = Object.values(values)[0] || "New";
  return mainValue.charAt(0).toUpperCase() + mainValue.slice(1);
};

export const createInstanceFromClass = async (classData, newValues = {}) => {
  logEvent("instance.create_from_class.started", {
    class_id: classData.id,
    class_name: classData.name,
    value_count: Object.keys(newValues).length
  });

  const originalTemplateSceneGraph = deepCloneSceneGraph(classData.template.sceneGraph);
  
  const { sceneGraph, overrides: initialOverrides } = resolvePlaceholdersInSceneGraph(
    classData.template.sceneGraph,
    newValues,
    classData.originalData?.sceneGraph
  );

  let textDescription = classData.template.textDescription || "";
  try {
    textDescription = await generateSceneGraphTextDescription(sceneGraph);
  } catch (error) {
    console.error("Failed to generate text description from sceneGraph:", error);
    textDescription = classData.template.textDescription || generateInstanceLabel(newValues);
  }

  const newInstance = {
    id: `instance-${uuidv4()}`,
    instanceLabel: generateInstanceLabel(newValues),
    sceneGraph,
    textDescription,
    createdAt: new Date().toISOString(),
    createdFrom: classData.name,
    classId: classData.id,
    isFromClass: true,
    overrides: initialOverrides,
    originalSceneGraph: originalTemplateSceneGraph,
  };

  logEvent("instance.created_from_class", {
    instance_id: newInstance.id,
    class_id: classData.id,
    instance_label: newInstance.instanceLabel,
    has_text_description: !!textDescription
  });
  
  return newInstance;
};

export const updateInstanceWithOverrides = (instance, updates, classes) => {
  if (!instance.isFromClass) {
    return { ...instance, ...updates };
  }

  const classData = classes.find(cls => cls.id === instance.classId);
  if (!classData) {
    return { ...instance, ...updates };
  }

  const updatedSceneGraph = updates.sceneGraph || instance.sceneGraph;
  const newOverrides = calculateInstanceOverrides(
    classData.template.sceneGraph,
    updatedSceneGraph,
    instance.originalSceneGraph,
    classData.placeholders
  );

  return {
    ...instance,
    ...updates,
    overrides: {
      ...newOverrides,
      ...(updates.textDescription &&
      updates.textDescription !== classData.template.textDescription
        ? { textDescription: true }
        : {}),
    },
  };
};

export const resetInstanceToClass = (instance, classes) => {
  if (!instance.isFromClass) {
    return instance;
  }

  const classData = classes.find(cls => cls.id === instance.classId);
  if (!classData) {
    return instance;
  }

  return {
    ...instance,
    sceneGraph: resetInstanceOverrides(
      classData.template.sceneGraph,
      instance.originalSceneGraph,
      classData.placeholders
    ),
    textDescription: classData.template.textDescription,
    overrides: {},
  };
};

export const duplicateInstance = (instanceData) => {
  const newId = `instance-${uuidv4()}`;
  return {
    id: newId,
    instanceLabel: instanceData.instanceLabel + " Copy",
    sceneGraph: deepCloneSceneGraph(instanceData.sceneGraph),
    textDescription: instanceData.textDescription,
    createdAt: new Date().toISOString(),
    createdFrom: instanceData.instanceLabel,
    isFromClass: instanceData.isFromClass || false,
    classId: instanceData.classId,
    overrides: instanceData.overrides ? { ...instanceData.overrides } : {},
    originalSceneGraph: instanceData.originalSceneGraph,
  };
};

export const extractObjectFromInstance = (objectId, sourceInstance) => {
  if (!sourceInstance.sceneGraph?.objects) {
    throw new Error("Source instance or sceneGraph not found");
  }

  const objectToExtract = sourceInstance.sceneGraph.objects.find(obj => obj.id === objectId);
  if (!objectToExtract) {
    throw new Error("Object to extract not found");
  }

  const newInstanceId = `instance-${uuidv4()}`;
  const extractedObjectWithNewId = {
    ...objectToExtract,
    id: `object-${uuidv4()}`
  };
  
  const newInstanceSceneGraph = {
    objects: [extractedObjectWithNewId],
    relationships: []
  };

  const newInstance = {
    id: newInstanceId,
    instanceLabel: `${objectToExtract.name}`,
    textDescription: `${objectToExtract.name}`,
    sceneGraph: newInstanceSceneGraph,
    isFromClass: false,
    classId: null,
    overrides: {},
    createdAt: new Date().toISOString(),
    originalSceneGraph: newInstanceSceneGraph,
  };

  const updatedSourceSceneGraph = {
    ...sourceInstance.sceneGraph,
    objects: sourceInstance.sceneGraph.objects.filter(obj => obj.id !== objectId),
    relationships: sourceInstance.sceneGraph.relationships.filter(rel => 
      rel.source !== objectId && rel.target !== objectId
    )
  };

  const extractedRelationships = sourceInstance.sceneGraph.relationships.filter(rel => 
    rel.source === objectId || rel.target === objectId
  );

  const interInstanceRelationships = [];
  extractedRelationships.forEach(rel => {
    if (rel.source === objectId) {
      const targetObjectInSource = updatedSourceSceneGraph.objects.find(obj => obj.id === rel.target);
      if (targetObjectInSource) {
        interInstanceRelationships.push({
          source: newInstanceId,
          target: sourceInstance.id,
          relation: rel.relation || "related_to"
        });
      }
    } else if (rel.target === objectId) {
      const sourceObjectInSource = updatedSourceSceneGraph.objects.find(obj => obj.id === rel.source);
      if (sourceObjectInSource) {
        interInstanceRelationships.push({
          source: sourceInstance.id,
          target: newInstanceId,
          relation: rel.relation || "related_to"
        });
      }
    }
  });

  const updatedSourceInstance = {
    ...sourceInstance,
    sceneGraph: updatedSourceSceneGraph,
  };

  const newInstanceWithRelationships = {
    ...newInstance,
    interInstanceRelationships
  };

  return {
    newInstance: newInstanceWithRelationships,
    updatedSourceInstance
  };
};

export const updateInstancesFromClassTemplate = async (updatedClass, instances) => {
  const instancesFromClass = instances.filter(instance => instance.classId === updatedClass.id);
  
  const updatePromises = instancesFromClass.map(async (instance) => {
    const newSceneGraph = applyClassUpdatesToInstance(
      updatedClass.template.sceneGraph,
      instance.overrides,
      instance.originalSceneGraph,
      updatedClass.placeholders
    );

    let newTextDescription = instance.textDescription;
    if (!instance.overrides.textDescription) {
      try {
        newTextDescription = await generateSceneGraphTextDescription(newSceneGraph);
      } catch (error) {
        console.error("Failed to update text description for instance:", instance.id, error);
        newTextDescription = updatedClass.template.textDescription || instance.textDescription;
      }
    }

    return {
      ...instance,
      sceneGraph: newSceneGraph,
      textDescription: newTextDescription,
    };
  });

  return await Promise.all(updatePromises);
};