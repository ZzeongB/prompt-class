import React, { useState, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  generateSceneGraphToText,
  generateTextToGraph,
} from "../../api/generateTextToGraph";
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
      const instanceLabel = sceneGraph.objects?.[0]?.name || "New Box";
      setSceneData({
        instanceLabel,
        textDescription: description,
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

  const handleInstanceLabelChange = async (newLabel) => {
    setSceneData((prev) => ({
      ...prev,
      instanceLabel: newLabel,
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
      const instanceLabel = sceneGraph.objects?.[0]?.name || currLabel;

      setSceneData((prev) => ({
        ...prev,
        sceneGraph: sceneGraph,
        instanceLabel: instanceLabel,
        textDescription: newDescription,
      }));
      onUpdate?.({
        label: instanceLabel,
        textDescription: newDescription,
      });
    } catch (error) {
      setSceneData((prev) => ({
        ...prev,
        textDescription: prevText,
      }));
      alert("Failed to update the scene. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSceneGraphChange = async (updatedSceneGraph, update = true) => {
    if (!update) {
      console.log("without");
      setSceneData((prev) => ({
        ...prev,
        sceneGraph: updatedSceneGraph,
      }));
      return;
    }
    setIsUpdating(true);

    try {
      const newText = await generateSceneGraphToText({
        newSceneGraph: updatedSceneGraph,
        previousSceneGraph: sceneData.sceneGraph,
        previousTextDescription: sceneData.textDescription,
      });
      const newLabel =
        updatedSceneGraph.objects?.[0]?.name || sceneData.instanceLabel;

      setSceneData((prev) => ({
        ...prev,
        sceneGraph: updatedSceneGraph,
        textDescription: newText,
        instanceLabel: newLabel,
      }));

      onUpdate?.({
        label: newLabel,
        textDescription: newText,
      });
    } catch (error) {
      console.error(
        "Failed to update from sceneGraph:",
        updatedSceneGraph,
        error
      );
      alert("Scene update failed. Try again.");
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
      isUpdating={isUpdating}
      onInstanceLabelChange={handleInstanceLabelChange}
      onDescriptionChangeDebounced={handleDescriptionChangeWithDebounce}
      onSceneGraphChange={handleSceneGraphChange}
      onDelete={handleDelete}
      modal={modal}
      setModal={setModal}
      showToolbar={true}
    />
  );
}
