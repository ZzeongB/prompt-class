import React, { useState, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  generateSceneGraphToText,
  generateTextToGraph,
} from "../../api/generateTextToGraph";
import { transformTreeToSceneGraph } from "../../utils/tree/transformTreeToSceneGraph";
import { transformSceneGraphToTree } from "../../utils/tree/transformSceneGraphToTree";
import PanelTemplate from "../PanelTemplate";

export default function InstancePanelNode({ id, data, onUpdate }) {
  const toolbarRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(
    data?.justCreated === true
  );
  const [modal, setModal] = useState(null);

  // initialSceneData가 있으면 사용, 없으면 기본값 사용
  const [sceneData, setSceneData] = useState(() => {
    if (data?.initialSceneData) {
      console.log("Using initialSceneData:", data.initialSceneData);
      return data.initialSceneData;
    }
    
    return {
      instanceLabel: data?.label || "New Box",
      textDescription: "",
      tree: {
        id: "root",
        data: { label: data?.label || "New Box", type: "object" },
        children: [],
      },
      sceneGraph: {},
    };
  });

  const hasPromptedRef = useRef(false);
  const { getNodes, setNodes, deleteElements } = useReactFlow();

  const handleDelete = () => {
    const nodes = getNodes();
    const sharedId = data.sharedId ?? id;
    const toDelete = nodes.filter(
      (n) => n.id === id || n.data?.sharedId === sharedId
    );
    deleteElements({ nodes: toDelete });
  };

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: sceneData.instanceLabel,
              textDescription: sceneData.textDescription,
              tree: sceneData.tree,
              sceneGraph: sceneData.sceneGraph,
            },
          };
        }
        return node;
      })
    );
  }, [sceneData, id, setNodes]);

  useEffect(() => {
    if (data?.justCreated && isInitializing && !hasPromptedRef.current) {
      hasPromptedRef.current = true;
      setModal({
        title: "Enter description:",
        defaultValue: "",
        onSubmit: (description) => {
          setModal(null);
          if (description) {
            handleInitialDescriptionInput(description);
          } else {
            setIsInitializing(false);
          }
        },
        onCancel: () => {
          setModal(null);
          setIsInitializing(false);
        },
      });
    }
  }, [data?.justCreated, isInitializing]);

  const handleInitialDescriptionInput = async (description) => {
    setIsUpdating(true);
    try {
      const sceneGraph = await generateTextToGraph({
        newTextDescription: description,
      });
      const newTree = transformSceneGraphToTree(
        sceneGraph,
        sceneData.instanceLabel
      );
      const instanceLabel = sceneGraph.objects?.[0]?.name || "New Box";
      setSceneData({
        instanceLabel,
        textDescription: description,
        tree: newTree,
        sceneGraph,
      });
      onUpdate?.({
        label: instanceLabel,
        textDescription: description,
        justCreated: false,
      });
    } catch (error) {
      console.error("Failed to generate initial scene graph:", error);
    } finally {
      setIsUpdating(false);
      setIsInitializing(false);
    }
  };

  const handleLabelChange = async (nodeId, newLabel) => {
    const updateNodeLabel = (node, targetId, newLabel) => {
      if (node.id === targetId) {
        return { ...node, data: { ...node.data, label: newLabel } };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map((child) =>
            updateNodeLabel(child, targetId, newLabel)
          ),
        };
      }
      return node;
    };

    const updatedTree = updateNodeLabel(sceneData.tree, nodeId, newLabel);
    const updatedSceneGraph = transformTreeToSceneGraph(updatedTree);
    const newDescription = await generateSceneGraphToText(
      updatedSceneGraph,
      sceneData.sceneGraph,
      sceneData.textDescription
    );

    setIsUpdating(true);
    setSceneData((prev) => ({
      ...prev,
      tree: updatedTree,
      textDescription: newDescription,
      sceneGraph: updatedSceneGraph,
    }));
    onUpdate?.({
      label: sceneData.instanceLabel,
      textDescription: newDescription,
    });
    setIsUpdating(false);
  };

  const handleInstanceLabelChange = async (newLabel) => {
    setSceneData((prev) => ({
      ...prev,
      instanceLabel: newLabel,
      tree: {
        ...prev.tree,
        data: { ...prev.tree.data, label: newLabel },
      },
    }));
    onUpdate?.({ label: newLabel });
  };

  const handleDescriptionChange = async (newDescription) => {
    if (!newDescription || newDescription === sceneData.textDescription) return;

    setIsUpdating(true);
    const prevText = sceneData.textDescription;
    const prevGraph = sceneData.sceneGraph;
    const currLabel = sceneData.instanceLabel;

    setSceneData((prev) => ({ ...prev, textDescription: newDescription }));

    try {
      const sceneGraph = await generateTextToGraph({
        newTextDescription: newDescription,
        previousSceneGraph: prevGraph,
        previousTextDescription: prevText,
      });
      const newTree = transformSceneGraphToTree(sceneGraph, currLabel);
      const instanceLabel = sceneGraph.objects?.[0]?.name || currLabel;

      setSceneData((prev) => ({
        ...prev,
        tree: newTree,
        sceneGraph: sceneGraph,
        instanceLabel: instanceLabel,
        textDescription: newDescription,
      }));
      onUpdate?.({
        label: instanceLabel,
        textDescription: newDescription,
      });
    } catch (error) {
      console.error("Failed to update tree:", error);
      setSceneData((prev) => ({
        ...prev,
        textDescription: prevText,
      }));
      alert("Failed to update the scene. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const [descriptionTimeout, setDescriptionTimeout] = useState(null);
  const handleDescriptionChangeWithDebounce = (newDescription) => {
    setSceneData((prev) => ({ ...prev, textDescription: newDescription }));
    if (descriptionTimeout) clearTimeout(descriptionTimeout);
    const timeoutId = setTimeout(() => {
      handleDescriptionChange(newDescription);
    }, 1000);
    setDescriptionTimeout(timeoutId);
  };

  useEffect(() => {
    return () => {
      if (descriptionTimeout) {
        clearTimeout(descriptionTimeout);
      }
    };
  }, [descriptionTimeout]);

  return (
    <PanelTemplate
      id={id}
      data={data}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      sceneData={sceneData}
      setSceneData={setSceneData}
      isUpdating={isUpdating}
      onInstanceLabelChange={handleInstanceLabelChange}
      onDescriptionChangeDebounced={handleDescriptionChangeWithDebounce}
      onLabelChange={handleLabelChange}
      onDelete={handleDelete}
      modal={modal}
      setModal={setModal}
      showToolbar={true}
    />
  );
}