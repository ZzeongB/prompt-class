import { v4 as uuidv4 } from "uuid";
import { 
  deepCloneSceneGraph, 
  generateSceneGraphTextDescription,
  generateInstanceLabelFromDescription
} from './SceneGraphUtils';
import { resolvePlaceholdersInSceneGraph } from './PlaceholderUtils';
import { 
  calculateInstanceOverrides, 
  applyClassUpdatesToInstance,
  resetInstanceOverrides 
} from './OverrideUtils';
import { getLayoutBoxesFromNodes } from './boundingBox';
import { logEvent } from "../api/logEvent";

export const generateInstanceLabel = (values) => {  
  // Handle different types of values
  let labelString;
  if (typeof values === 'string') {
    labelString = values;
  } else if (typeof values === 'object' && values !== null) {
    // If it's an object (like scene graph), try to extract a meaningful name
    if (values.objects && Array.isArray(values.objects) && values.objects.length > 0) {
      // Scene graph case - use the first object's name
      labelString = values.objects[0].name || "Object";
    } else if (values.name) {
      // Object with name property
      labelString = values.name;
    } else {
      labelString = "Object";
    }
  } else {
    labelString = String(values);
  }
  
  // Ensure we have a valid string before calling charAt
  if (typeof labelString !== 'string' || labelString.length === 0) {
    return "New";
  }
  
  return labelString.charAt(0).toUpperCase() + labelString.slice(1);
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
  let instanceLabel = generateInstanceLabel(newValues);
  try {
    textDescription = await generateSceneGraphTextDescription(sceneGraph);
    instanceLabel = await generateInstanceLabelFromDescription(textDescription);
    console.log("Generated text description:", textDescription, instanceLabel);
  } catch (error) {
    console.error("Failed to generate text description from sceneGraph:", error);
    textDescription = classData.template.textDescription || generateInstanceLabel(newValues);
    instanceLabel = generateInstanceLabel(newValues);
  }

  const newInstance = {
    id: `instance-${uuidv4()}`,
    instanceLabel: instanceLabel,
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

export const extractObjectFromInstance = async (objectId, sourceInstance) => {
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

  // Generate proper text description from scene graph
  let textDescription = objectToExtract.name;
  try {
    textDescription = await generateSceneGraphTextDescription(newInstanceSceneGraph);
  } catch (error) {
    console.error("Failed to generate text description for extracted instance:", error);
    // Fallback to object name with attributes if available
    const attributes = objectToExtract.attributes || {};
    const attributeStrings = Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    textDescription = attributeStrings 
      ? `${objectToExtract.name} (${attributeStrings})`
      : objectToExtract.name;
  }

  const newInstance = {
    id: newInstanceId,
    instanceLabel: `${objectToExtract.name}`,
    textDescription: textDescription,
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

  // Generate updated description for source instance
  let updatedSourceDescription = sourceInstance.textDescription;
  try {
    if (updatedSourceSceneGraph.objects.length > 0) {
      updatedSourceDescription = await generateSceneGraphTextDescription(updatedSourceSceneGraph);
    } else {
      updatedSourceDescription = "Empty scene";
    }
  } catch (error) {
    console.error("Failed to generate updated description for source instance:", error);
    // Keep original description as fallback
  }

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
    textDescription: updatedSourceDescription,
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
  
  const updatePromises = instancesFromClass.map(async (instance, index) => {
    const newSceneGraph = applyClassUpdatesToInstance(
      updatedClass.template.sceneGraph,
      instance.overrides,
      instance.originalSceneGraph,
      updatedClass.placeholders
    );

    let newTextDescription = instance.textDescription;
    if (!instance.overrides.textDescription) {
      try {
        newTextDescription = await generateSceneGraphTextDescription(newSceneGraph, instance.sceneGraph, instance.textDescription);
      } catch (error) {
        console.error("Failed to update text description for instance:", instance.id, error);
        newTextDescription = updatedClass.template.textDescription || instance.textDescription;
      }
    } 

    const updatedInstance = {
      ...instance,
      sceneGraph: newSceneGraph,
      textDescription: newTextDescription,
    };

    return updatedInstance;
  });

  const results = await Promise.all(updatePromises);
  return results;
};

export const mergeInstancesIntoOne = async (instances, nodes, edges, flowToScreenPosition, leftOffset, topOffset) => {
  if (instances.length < 2) {
    throw new Error("최소 2개의 인스턴스가 필요합니다.");
  }

  logEvent("instance.merge.started", {
    instanceCount: instances.length,
    instanceIds: instances.map(inst => inst.id)
  });

  // 1. Calculate center position and combined bounding box using existing logic
  let centerX = 0, centerY = 0;
  let validPositions = 0;
  let hasValidBbox = false;
  
  // Get nodes for selected instances
  const selectedNodes = instances.map(instance => {
    return nodes.find(n => n.data?.instanceId === instance.id && n.type === "resizable");
  }).filter(Boolean);
  
  console.log("Selected nodes for merge:", selectedNodes);

  // Use the existing getLayoutBoxesFromNodes function for accurate calculation
  let bboxes = [];
  if (selectedNodes.length > 0 && flowToScreenPosition) {
    bboxes = getLayoutBoxesFromNodes(selectedNodes, flowToScreenPosition, leftOffset, topOffset);
    console.log("Calculated bboxes using getLayoutBoxesFromNodes:", bboxes);
    hasValidBbox = bboxes.length > 0;
  }

  // Calculate combined bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  bboxes.forEach(([x1, y1, x2, y2]) => {
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  // Calculate center positions for node placement
  instances.forEach(instance => {
    if (instance.nodePosition) {
      centerX += instance.nodePosition.x;
      centerY += instance.nodePosition.y;
      validPositions++;
    }
  });
  
  // Calculate average center position
  if (validPositions > 0) {
    centerX /= validPositions;
    centerY /= validPositions;
  }

  console.log("Final combined bbox:", { minX, minY, maxX, maxY });

  // 2. Find relationships between selected instances from edges
  const selectedInstanceIds = new Set(instances.map(inst => inst.id));
  const interInstanceRelationships = edges.filter(edge => {
    const sourceInstanceId = nodes.find(n => n.id === edge.source)?.data?.instanceId;
    const targetInstanceId = nodes.find(n => n.id === edge.target)?.data?.instanceId;
    
    return selectedInstanceIds.has(sourceInstanceId) && 
           selectedInstanceIds.has(targetInstanceId) &&
           sourceInstanceId !== targetInstanceId; // 같은 instance 간의 edge는 제외
  });
  
  console.log("Inter-instance relationships found:", interInstanceRelationships);

  // 3. Collect all objects from all instances
  const allObjects = [];
  const allRelationships = [];
  const objectIdMapping = new Map(); // old id -> new id mapping
  const instanceToObjectMapping = new Map(); // instance id -> [object ids] mapping

  instances.forEach(instance => {
    const instanceObjectIds = [];
    
    if (instance.sceneGraph?.objects) {
      instance.sceneGraph.objects.forEach(obj => {
        const newObjectId = `object-${uuidv4()}`;
        objectIdMapping.set(obj.id, newObjectId);
        instanceObjectIds.push(newObjectId);
        allObjects.push({
          ...obj,
          id: newObjectId
        });
      });
    }
    
    instanceToObjectMapping.set(instance.id, instanceObjectIds);

    // Add intra-instance relationships
    if (instance.sceneGraph?.relationships) {
      instance.sceneGraph.relationships.forEach(rel => {
        // Update relationship IDs based on mapping
        const newSourceId = objectIdMapping.get(rel.source);
        const newTargetId = objectIdMapping.get(rel.target);
        
        if (newSourceId && newTargetId) {
          allRelationships.push({
            ...rel,
            source: newSourceId,
            target: newTargetId
          });
        }
      });
    }
  });

  // 4. Convert inter-instance relationships to object-level relationships
  interInstanceRelationships.forEach(edge => {
    const sourceInstanceId = nodes.find(n => n.id === edge.source)?.data?.instanceId;
    const targetInstanceId = nodes.find(n => n.id === edge.target)?.data?.instanceId;
    
    const sourceObjectIds = instanceToObjectMapping.get(sourceInstanceId) || [];
    const targetObjectIds = instanceToObjectMapping.get(targetInstanceId) || [];
    
    // Create relationships between objects of different instances
    // For simplicity, connect the first object of source to first object of target
    if (sourceObjectIds.length > 0 && targetObjectIds.length > 0) {
      allRelationships.push({
        source: sourceObjectIds[0],
        target: targetObjectIds[0],
        relation: edge.data?.relation || edge.label || "related_to"
      });
    }
  });

  // 5. Create new scene graph with merged objects and relationships
  const mergedSceneGraph = {
    objects: allObjects,
    relationships: allRelationships
  };
  
  console.log("Merged scene graph:", mergedSceneGraph);

  // 6. Generate text description from merged scene graph
  let textDescription = `Merged from: ${instances.map(inst => inst.instanceLabel).join(', ')}`;
  try {
    textDescription = await generateSceneGraphTextDescription(mergedSceneGraph);
  } catch (error) {
    console.error("Failed to generate text description for merged instance:", error);
    // Fallback: combine descriptions
    textDescription = instances.map(inst => inst.textDescription).join('. ');
  }

  // 7. Generate instance label
  const instanceLabel = generateInstanceLabel(allObjects[0]?.name || "Merged Object");

  // 8. Create merged instance
  const mergedInstance = {
    id: `instance-${uuidv4()}`,
    instanceLabel,
    textDescription,
    sceneGraph: mergedSceneGraph,
    isFromClass: false,
    classId: null,
    overrides: {},
    createdAt: new Date().toISOString(),
    originalSceneGraph: mergedSceneGraph,
    // Store node position for proper placement
    ...(validPositions > 0 && {
      nodePosition: { x: centerX, y: centerY }
    }),
    // Preserve combined bounding box if available
    ...(hasValidBbox && minX !== Infinity && {
      detectedObject: {
        bbox: [minX, minY, maxX, maxY],
        label: instanceLabel,
        confidence: Math.max(...instances.filter(inst => inst.detectedObject?.confidence).map(inst => inst.detectedObject.confidence), 0.5)
      }
    })
  };

  logEvent("instance.merged", {
    mergedInstanceId: mergedInstance.id,
    originalInstanceIds: instances.map(inst => inst.id),
    objectCount: allObjects.length,
    relationshipCount: allRelationships.length,
    hasTextDescription: !!textDescription
  });

  return mergedInstance;
};