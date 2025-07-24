import React, { useState, useEffect, useRef } from "react";
import { WHITE } from "../../utils/constants";
import TreeNode from "../TreeNode";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  generateSceneGraphToText,
  generateTextToGraph,
} from "../../api/generateTextToGraph";
import PromptModal from "../PromptModal"; // 경로는 맞게 조정
import { transformTreeToSceneGraph } from "../../utils/tree/transformTreeToSceneGraph";
import { transformSceneGraphToTree } from "../../utils/tree/transformSceneGraphToTree";
import NodeToolbarMenu from "../nodeComponents/NodeToolbarMenu";
import { useReactFlow } from "@xyflow/react";

// 메인 LayoutTreeNode 컴포넌트
export default function LayoutTreeNode({ id, data, onUpdate }) {
  const toolbarRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(
    data?.justCreated === true
  );
  const [modal, setModal] = useState(null);

  const [sceneData, setSceneData] = useState({
    instanceLabel: data?.label || "New Box",
    textDescription: "",
    tree: {
      id: "root",
      data: { label: data?.label || "New Box", type: "object" },
      children: [],
    },
    sceneGraph: {},
  });

  const hasPromptedRef = useRef(false); // 🔥 렌더링 영향 안 받는 ref 사용

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
    if (data?.justCreated && isInitializing && !hasPromptedRef.current) {
      hasPromptedRef.current = true;

      // 모달 열기
      setModal({
        title: "Enter a description for this scene:",
        defaultValue: "",
        onSubmit: (description) => {
          setModal(null);
          if (description) {
            handleInitialDescriptionInput(description);
          } else {
            setIsInitializing(false); // 아무 것도 입력 안 하면 종료
          }
        },
        onCancel: () => {
          setModal(null);
          setIsInitializing(false);
        },
      });
    }
  }, [data?.justCreated, isInitializing]);

  // 초기 description 처리
  const handleInitialDescriptionInput = async (description) => {
    setIsUpdating(true);
    try {
      const sceneGraph = await generateTextToGraph({
        newTextDescription: description,
      });
      console.log("SG", sceneGraph);
      const newTree = transformSceneGraphToTree(
        sceneGraph,
        sceneData.instanceLabel
      );
      const instanceLabel = sceneGraph.objects?.[0]?.name || "New Box";

      console.log("newTree", newTree);

      setSceneData({
        instanceLabel,
        textDescription: description,
        tree: newTree,
        sceneGraph,
      });

      // 부모 컴포넌트에 업데이트 알림
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

  // TreeNode 라벨 변경 처리
  const handleLabelChange = async (nodeId, newLabel) => {
    const updateNodeLabel = (node, targetId, newLabel) => {
      if (node.id === targetId) {
        return {
          ...node,
          data: {
            ...node.data,
            label: newLabel,
          },
        };
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
      sceneData.sceneGraph, // 이전 그래프
      sceneData.textDescription // 이전 텍스트
    );

    setIsUpdating(true);
    setSceneData((prev) => ({
      ...prev,
      tree: updatedTree,
      textDescription: newDescription,
      sceneGraph: updatedSceneGraph, // ✅ 추가
    }));

    onUpdate?.({
      label: sceneData.instanceLabel,
      textDescription: newDescription,
    });

    setIsUpdating(false);
  };

  // Instance Label 변경 처리
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

  // Text Description 변경 처리
  // Text Description 변경 처리 - 수정된 버전
  const handleDescriptionChange = async (newDescription) => {
    if (!newDescription || newDescription === sceneData.textDescription) {
      return; // 변경사항이 없으면 종료
    }

    setIsUpdating(true);

    // 현재 상태를 미리 저장 (클로저 문제 해결)
    const previousTextDescription = sceneData.textDescription;
    const previousSceneGraph = sceneData.sceneGraph;
    const currentInstanceLabel = sceneData.instanceLabel;

    // UI 먼저 업데이트
    setSceneData((prev) => ({
      ...prev,
      textDescription: newDescription,
    }));

    try {
      // API 호출
      const sceneGraph = await generateTextToGraph({
        newTextDescription: newDescription,
        previousSceneGraph: previousSceneGraph, // 저장된 값 사용
        previousTextDescription: previousTextDescription, // 저장된 값 사용
      });

      console.log("Generated scene graph:", sceneGraph);

      // 새로운 트리 생성
      const newTree = transformSceneGraphToTree(
        sceneGraph,
        currentInstanceLabel
      );

      console.log("Generated tree:", newTree);

      // 인스턴스 라벨 업데이트 (scene graph의 첫 번째 객체 이름 사용)
      const instanceLabel =
        sceneGraph.objects?.[0]?.name || currentInstanceLabel;

      // 모든 상태 한 번에 업데이트
      setSceneData((prev) => ({
        ...prev,
        tree: newTree,
        sceneGraph: sceneGraph,
        instanceLabel: instanceLabel,
        textDescription: newDescription, // 다시 한 번 확실히 설정
      }));

      // 부모 컴포넌트에 업데이트 알림
      onUpdate?.({
        label: instanceLabel,
        textDescription: newDescription,
      });
    } catch (error) {
      console.error("Failed to update tree:", error);

      // 에러 발생 시 이전 상태로 복원
      setSceneData((prev) => ({
        ...prev,
        textDescription: previousTextDescription,
      }));

      // 사용자에게 에러 알림 (선택사항)
      alert("Failed to update the scene. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 추가: 디바운싱된 버전 (연속 입력 방지)
  const [descriptionTimeout, setDescriptionTimeout] = useState(null);

  const handleDescriptionChangeWithDebounce = (newDescription) => {
    // UI 즉시 업데이트
    setSceneData((prev) => ({
      ...prev,
      textDescription: newDescription,
    }));

    // 이전 타이머 취소
    if (descriptionTimeout) {
      clearTimeout(descriptionTimeout);
    }

    // 새 타이머 설정 (1초 후 API 호출)
    const timeoutId = setTimeout(() => {
      handleDescriptionChange(newDescription);
    }, 1000);

    setDescriptionTimeout(timeoutId);
  };

  // cleanup effect 추가
  useEffect(() => {
    return () => {
      if (descriptionTimeout) {
        clearTimeout(descriptionTimeout);
      }
    };
  }, [descriptionTimeout]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      style={{
        margin: "0 auto",
        padding: "5px",
        border: "2px solid #000",
        borderRadius: "0",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        overflow: "hidden",
        opacity: isUpdating ? 0.7 : 1,
        transition: "opacity 0.3s",
      }}
      // onClick={toggleExpanded}
    >
      {/* Instance Label Section */}
      <div
        style={{
          marginBottom: isExpanded ? "4px" : "0",
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#000",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.2",
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const newLabel = prompt(
              "Enter new label:",
              sceneData.instanceLabel
            );
            if (newLabel && newLabel !== sceneData.instanceLabel) {
              handleInstanceLabelChange(newLabel);
            }
          }}
        >
          {sceneData.instanceLabel}
        </div>
        <span
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            padding: "2px",
            fontSize: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
        >
          {isExpanded ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </span>
        {isUpdating && (
          <span style={{ color: "#007bff", fontSize: "9px" }}>
            {" "}
            Updating...
          </span>
        )}
      </div>
      {/* 확장된 콘텐츠 */}
      {isExpanded && (
        <>
          {/* Text Description Section */}
          <div
            style={{
              marginBottom: "4px",
              flex: "0 0 auto",
              background: WHITE,
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: "#888",
                lineHeight: "1.2",
                fontFamily: "Arial, sans-serif",
                fontStyle: "italic",
                cursor: "text",
                minHeight: "12px",
                padding: "2px",
                border: "1px solid transparent",
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                const newDescription = prompt(
                  "Enter new description:",
                  sceneData.textDescription
                );
                if (
                  newDescription &&
                  newDescription !== sceneData.textDescription
                ) {
                  handleDescriptionChangeWithDebounce(newDescription);
                }
              }}
            >
              {sceneData.textDescription}
            </div>
          </div>

          <TreeNode
            node={sceneData.tree}
            onLabelChange={handleLabelChange}
            depth={0}
          />
        </>
      )}
      {modal && (
        <PromptModal
          title={modal.title}
          defaultValue={modal.defaultValue}
          onSubmit={modal.onSubmit}
          onCancel={modal.onCancel}
        />
      )}
      <NodeToolbarMenu
        ref={toolbarRef}
        isVisible={isExpanded}
        onDelete={handleDelete}
        style={{ top: "10px" }}
      />
    </div>
  );
}
