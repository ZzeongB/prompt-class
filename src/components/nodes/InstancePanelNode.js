import React, { useState, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  generateSceneGraphToText,
  generateTextToGraph,
} from "../../api/generateTextToGraph";
import PanelTemplate from "../PanelTemplate";
import { useClassContext } from "../../context/ClassContext";

export default function InstancePanelNode({ id, data, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(data?.justCreated === true);
  const [modal, setModal] = useState(null);

  const { updateInstance, deleteInstance, classes, instances } = useClassContext();
  const { getNodes, setNodes, deleteElements } = useReactFlow();

  // 로컬 sceneData 상태 (빠른 UI 반응용)
  const [sceneData, setSceneData] = useState({
    instanceLabel: data?.instanceLabel || data?.label || "New Box",
    textDescription: data?.textDescription || "",
    sceneGraph: data?.sceneGraph || {},
  });

  const hasPromptedRef = useRef(false);
  const syncingRef = useRef(false);

  // ClassContext 데이터와 동기화
  useEffect(() => {
    if (syncingRef.current) return; // 자신이 업데이트한 경우 스킵
    
    const instanceData = instances.find(inst => inst.id === id);
    if (instanceData) {
      setSceneData({
        instanceLabel: instanceData.instanceLabel || "New Box",
        textDescription: instanceData.textDescription || "",
        sceneGraph: instanceData.sceneGraph || {},
      });
    }
  }, [instances, id]);

  // 현재 인스턴스가 클래스에서 파생되었는지 확인
  const instanceData = instances.find(inst => inst.id === id) || {};
  const isFromClass = instanceData.isFromClass || data?.isFromClass;
  const parentClass = isFromClass ? classes.find(cls => cls.id === (instanceData.classId || data?.classId)) : null;

  const handleDelete = () => {
    deleteInstance(id);
  };

  // 양방향 동기화 헬퍼 함수
  const syncUpdate = (updates) => {
    syncingRef.current = true;
    
    // 1. 로컬 상태 즉시 업데이트 (빠른 UI 반응)
    setSceneData(prev => ({ ...prev, ...updates }));
    
    // 2. ReactFlow 노드 업데이트
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id || node.data?.sharedId === data.sharedId) {
          return {
            ...node,
            data: { ...node.data, ...updates }
          };
        }
        return node;
      })
    );
    
    // 3. ClassContext 업데이트
    updateInstance(id, updates);
    
    setTimeout(() => {
      syncingRef.current = false;
    }, 100);
  };

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
            syncUpdate({ justCreated: false });
          }
        },
        onCancel: () => {
          setModal(null);
          setIsInitializing(false);
          syncUpdate({ justCreated: false });
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
      
      syncUpdate({
        instanceLabel,
        textDescription: description,
        sceneGraph,
        justCreated: false,
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
    syncUpdate({ instanceLabel: newLabel });
    onUpdate?.({ label: newLabel });
  };

  const handleDescriptionChange = async (newDescription) => {
    if (!newDescription || newDescription === sceneData.textDescription) return;

    setIsUpdating(true);
    const prevText = sceneData.textDescription;
    const prevGraph = sceneData.sceneGraph;
    const currLabel = sceneData.instanceLabel;

    try {
      const sceneGraph = await generateTextToGraph({
        newTextDescription: newDescription,
        previousSceneGraph: prevGraph,
        previousTextDescription: prevText,
      });
      const instanceLabel = sceneGraph.objects?.[0]?.name || currLabel;

      syncUpdate({
        instanceLabel,
        textDescription: newDescription,
        sceneGraph,
      });
      
      onUpdate?.({
        label: instanceLabel,
        textDescription: newDescription,
      });
    } catch (error) {
      console.error("Failed to update the scene:", error);
      alert("Failed to update the scene. Please try again.");
      // 에러 시 이전 상태로 복원
      setSceneData(prev => ({ ...prev, textDescription: prevText }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSceneGraphChange = async (updatedSceneGraph, update = true) => {
    if (!update) {
      syncUpdate({ sceneGraph: updatedSceneGraph });
      return;
    }
    
    setIsUpdating(true);

    try {
      const newText = await generateSceneGraphToText({
        newSceneGraph: updatedSceneGraph,
        previousSceneGraph: sceneData.sceneGraph,
        previousTextDescription: sceneData.textDescription,
      });
      const newLabel = updatedSceneGraph.objects?.[0]?.name || sceneData.instanceLabel;

      syncUpdate({
        instanceLabel: newLabel,
        textDescription: newText,
        sceneGraph: updatedSceneGraph,
      });

      onUpdate?.({
        label: newLabel,
        textDescription: newText,
      });
    } catch (error) {
      console.error("Failed to update from sceneGraph:", updatedSceneGraph, error);
      alert("Scene update failed. Try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const [descriptionTimeout, setDescriptionTimeout] = useState(null);
  const handleDescriptionChangeWithDebounce = (newDescription) => {
    // 즉시 로컬 상태 업데이트
    setSceneData(prev => ({ ...prev, textDescription: newDescription }));
    
    if (descriptionTimeout) clearTimeout(descriptionTimeout);
    
    const timeoutId = setTimeout(() => {
      handleDescriptionChange(newDescription);
    }, 1000);
    setDescriptionTimeout(timeoutId);
  };

  useEffect(() => {
    return () => {
      if (descriptionTimeout) clearTimeout(descriptionTimeout);
    };
  }, [descriptionTimeout]);

  // 클래스 연결 상태 표시용 데이터
  const enhancedData = {
    ...data,
    instanceLabel: sceneData.instanceLabel,
    textDescription: sceneData.textDescription,
    sceneGraph: sceneData.sceneGraph,
    isFromClass,
    parentClassName: parentClass?.name,
    hasOverrides: instanceData.overrides && Object.keys(instanceData.overrides).length > 0,
  };

  return (
    <PanelTemplate
      id={id}
      data={enhancedData}
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