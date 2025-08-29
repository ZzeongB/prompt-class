import { getNormalizedBox } from './node/getNormalizedBox';
import { 
  LEFT_OFFSET_BASELINE as LEFT_OFFSET,
  TOP_OFFSET 
} from './constants';

/**
 * Export current scene to promptData.json format
 */
export const exportSceneToPromptData = (
  nodes,
  edges,
  instances,
  globalCaption,
  flowToScreenPosition,
  sceneId = null,
  sceneTitle = null
) => {
  try {
    // Filter out resizable nodes and get only simple nodes
    const simpleNodes = nodes.filter(node => node.type === 'simple');
    const resizableNodes = nodes.filter(node => node.type === 'resizable');

    // Create instances data from nodes
    const exportInstances = simpleNodes.map(node => {
      const resizableNode = resizableNodes.find(rn => 
        rn.data?.sharedId === node.data?.sharedId || 
        rn.id === `${node.id}-resizable`
      );
      
      let boundingBox;
      if (resizableNode) {
        // Use resizable node dimensions and position
        boundingBox = {
          x: Math.round(resizableNode.position.x),
          y: Math.round(resizableNode.position.y),
          width: Math.round(resizableNode.style?.width || resizableNode.width || 100),
          height: Math.round(resizableNode.style?.height || resizableNode.height || 100)
        };
      } else {
        // Fallback to simple node position
        boundingBox = {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
          width: Math.round(node.style?.width || 120),
          height: Math.round(node.style?.height || 40)
        };
      }

      // Find corresponding instance data
      const instanceData = instances.find(inst => 
        inst.id === node.data?.instanceId || 
        inst.id === node.data?.sharedId ||
        inst.id === node.id
      );

      return {
        id: node.data?.instanceId || node.data?.sharedId || node.id,
        label: node.data?.instanceLabel || node.data?.label,
        textDescription: instanceData?.textDescription || node.data?.label || "No description",
        sceneGraph: instanceData?.sceneGraph || [],
        boundingBox: boundingBox,
        isFromClass: Boolean(node.data?.isFromClass),
        ...(node.data?.parentClassName && { classId: node.data.parentClassName })
      };
    });

    // Create scene graph relationships from edges
    const relationships = edges.map(edge => ({
      type: edge.data?.type || "spatial",
      from: edge.source,
      to: edge.target,
      relationship: edge.label || edge.data?.relation || "connected to"
    }));

    // Create scene data structure
    const sceneData = {
      id: sceneId || Date.now(),
      title: sceneTitle || `Scene ${new Date().toLocaleString()}`,
      globalCaption: globalCaption || "Generated scene",
      instances: exportInstances,
      sceneGraph: {
        relationships: relationships
      },
      exportedAt: new Date().toISOString(),
      nodeCount: simpleNodes.length,
      edgeCount: edges.length
    };

    return sceneData;
  } catch (error) {
    console.error('Error exporting scene:', error);
    throw new Error(`Failed to export scene: ${error.message}`);
  }
};

/**
 * Download scene data as JSON file
 */
export const downloadSceneAsJSON = (sceneData, filename = null) => {
  try {
    const dataStr = JSON.stringify([sceneData], null, 2); // Wrap in array to match promptData format
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `scene_${sceneData.id}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log('Scene exported successfully:', sceneData);
    return true;
  } catch (error) {
    console.error('Error downloading scene:', error);
    throw new Error(`Failed to download scene: ${error.message}`);
  }
};

/**
 * Save scene data to localStorage
 */
export const saveSceneToLocalStorage = (sceneData, key = 'exported_scenes') => {
  try {
    const existingScenes = JSON.parse(localStorage.getItem(key) || '[]');
    existingScenes.push(sceneData);
    localStorage.setItem(key, JSON.stringify(existingScenes));
    
    console.log('Scene saved to localStorage:', sceneData.title);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw new Error(`Failed to save scene: ${error.message}`);
  }
};