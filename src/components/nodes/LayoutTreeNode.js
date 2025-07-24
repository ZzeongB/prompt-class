import React, { useState } from "react";
import { WHITE } from "../../utils/constants";
import TreeNode from "../TreeNode";
import { ChevronRight, ChevronDown } from "lucide-react";

// Scene Graph를 TreeNode 형태로 변환
const transformSceneGraphToTree = (sceneGraph, instanceLabel) => {
  if (!sceneGraph || !sceneGraph.objects || sceneGraph.objects.length === 0) {
    return {
      id: "root",
      data: { label: instanceLabel || "Empty", type: "object" },
      children: []
    };
  }

  const mainObject = sceneGraph.objects[0]; // 첫 번째 객체를 루트로
  const children = [];

  // 속성들 추가
  if (mainObject.attributes) {
    mainObject.attributes.forEach((attr, idx) => {
      children.push({
        id: `attr-${idx}`,
        data: {
          label: attr,
          type: "attribute",
          hasValue: attr,
        },
        children: [],
      });
    });
  }

  // 관계들 추가
  if (sceneGraph.relationships) {
    sceneGraph.relationships.forEach((rel, idx) => {
      const relatedObject = sceneGraph.objects.find(obj => obj.id === rel.target);
      const relChildren = [];
      
      if (relatedObject) {
        const relObjChildren = [];
        if (relatedObject.attributes) {
          relatedObject.attributes.forEach((attr, attrIdx) => {
            relObjChildren.push({
              id: `rel-${idx}-obj-attr-${attrIdx}`,
              data: {
                label: attr,
                type: "attribute",
                hasValue: attr,
              },
              children: [],
            });
          });
        }

        relChildren.push({
          id: `rel-${idx}-obj`,
          data: {
            label: relatedObject.name,
            type: "object",
          },
          children: relObjChildren,
        });
      }

      children.push({
        id: `rel-${idx}`,
        data: {
          label: rel.relation,
          type: "relationship",
        },
        children: relChildren,
      });
    });
  }

  return {
    id: "root",
    data: {
      label: mainObject.name,
      type: "object",
    },
    children,
  };
};


// 메인 SceneGraphViewer 컴포넌트
export default function LayoutTreeNode({ id, data }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sceneData, setSceneData] = useState({
    instanceLabel: "Cactus",
    textDescription: "Smiling Cactus in flower pot with blooming flowers",
    tree: {
      id: "root",
      data: {
        label: "Cactus",
        type: "object",
      },
      children: [
        {
          id: "attr1",
          data: {
            label: "smiling",
            type: "attribute",
            hasValue: "smiling",
          },
          children: [],
        },
        {
          id: "attr2",
          data: {
            label: "blooming",
            type: "attribute",
            hasValue: "blooming",
          },
          children: [],
        },
        {
          id: "rel1",
          data: {
            label: "in",
            type: "relationship",
          },
          children: [
            {
              id: "obj2",
              data: {
                label: "flower pot",
                type: "object",
              },
              children: [
                {
                  id: "attr3",
                  data: {
                    label: "brown",
                    type: "attribute",
                    hasValue: "brown",
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const handleLabelChange = (nodeId, newLabel) => {
    console.log(`Label changed for ${nodeId}: ${newLabel}`);
    // 여기에 실제 데이터 업데이트 로직 구현
  };

  const handleInstanceLabelChange = (e) => {
    setSceneData((prev) => ({
      ...prev,
      instanceLabel: e.target.value,
    }));
  };

  const handleDescriptionChange = (e) => {
    setSceneData((prev) => ({
      ...prev,
      textDescription: e.target.value,
    }));
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      style={{
        margin: "0 auto",
        padding: "5px",
        // backgroundColor: "#ffffff",
        border: "2px solid #000",
        borderRadius: "0",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      {/* Instance Label Section - 항상 보임 */}
      <div
        style={{
          marginBottom: isExpanded ? "4px" : "0",
          flex: "0 0 auto",
          display: "flex",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#000",
            marginBottom: "2px",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.2",
          }}
        >
          {sceneData.instanceLabel}
        </div>
        <input
          type="text"
          value={sceneData.instanceLabel}
          onChange={handleInstanceLabelChange}
          style={{
            display: "none",
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <span style={{ flexShrink: 0 }} onClick={toggleExpanded}>
          {isExpanded ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </span>
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
              }}
            >
              {sceneData.textDescription}
            </div>
            <textarea
              value={sceneData.textDescription}
              onChange={handleDescriptionChange}
              style={{
                display: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <TreeNode
            node={sceneData.tree}
            onLabelChange={handleLabelChange}
            depth={0}
          />
        </>
      )}
    </div>
  );
}
