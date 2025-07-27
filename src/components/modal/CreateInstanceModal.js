import React, { useState, useEffect, useMemo } from "react";
import { suggestPlaceholderValues } from "../../api/generatePlaceholders";
import { useClassContext } from "../../context/ClassContext";

export const CreateInstanceModal = ({ 
  classData, 
  isOpen, 
  onClose, 
  onCreateInstance 
}) => {
  const [values, setValues] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewSceneGraph, setPreviewSceneGraph] = useState(null);
  const [editingPlaceholder, setEditingPlaceholder] = useState(null);
  
  const { createInstanceFromClass } = useClassContext();

  // scene graph에서 placeholder들과 기본값들 추출하는 함수
  const extractPlaceholdersFromSceneGraph = (sceneGraph, placeholders = {}) => {
    const placeholderSet = new Set();
    const defaultValues = {};
    
    if (!sceneGraph?.objects) return { placeholders: [], defaultValues: {} };
    
    sceneGraph.objects.forEach(obj => {
      // 객체 이름에서 placeholder 추출
      if (obj.name && obj.name.includes('{') && obj.name.includes('}')) {
        const placeholder = obj.name.replace(/[{}]/g, '');
        placeholderSet.add(placeholder);
        
        // placeholders에서 기본값 찾기
        const defaultValue = Object.keys(placeholders).find(
          key => placeholders[key] === placeholder
        );
        if (defaultValue) {
          defaultValues[placeholder] = defaultValue;
        }
      }
      
      // attributes에서 placeholder 추출
      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes.forEach(attr => {
          if (typeof attr === 'string' && attr.includes('{') && attr.includes('}')) {
            const placeholder = attr.replace(/[{}]/g, '');
            placeholderSet.add(placeholder);
            
            // placeholders에서 기본값 찾기
            const defaultValue = Object.keys(placeholders).find(
              key => placeholders[key] === placeholder
            );
            if (defaultValue) {
              defaultValues[placeholder] = defaultValue;
            }
          }
        });
      }
    });
    
    return { 
      placeholders: Array.from(placeholderSet), 
      defaultValues 
    };
  };

  // scene graph를 values로 업데이트하는 함수
  const createUpdatedSceneGraph = (templateSceneGraph, currentValues) => {
    const updated = JSON.parse(JSON.stringify(templateSceneGraph)); // deep copy
    
    updated.objects?.forEach(obj => {
      // 객체 이름에서 placeholder 교체
      if (obj.name && obj.name.includes('{') && obj.name.includes('}')) {
        const placeholder = obj.name.replace(/[{}]/g, '');
        const value = currentValues[placeholder];
        if (value !== undefined) {
          obj.name = value;
        }
      }
      
      // attributes에서 placeholder 교체
      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes = obj.attributes.map(attr => {
          if (typeof attr === 'string' && attr.includes('{') && attr.includes('}')) {
            const placeholder = attr.replace(/[{}]/g, '');
            const value = currentValues[placeholder];
            if (value !== undefined) {
              return value;
            }
          }
          return attr;
        });
      }
    });
    
    return updated;
  };

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen && classData?.template?.sceneGraph) {
      setIsLoading(true);
      
      // scene graph에서 placeholder들과 기본값들 추출
      const { placeholders, defaultValues } = extractPlaceholdersFromSceneGraph(
        classData.template.sceneGraph, 
        classData.placeholders
      );
      
      // 기본값으로 values 초기화
      setValues(defaultValues);
      
      // 미리보기용 sceneGraph 생성
      setPreviewSceneGraph(createUpdatedSceneGraph(classData.template.sceneGraph, defaultValues));
      
      if (placeholders.length > 0) {
        // placeholder들에 대한 제안 가져오기
        const placeholderObj = placeholders.reduce((acc, placeholder) => {
          acc[placeholder] = placeholder;
          return acc;
        }, {});
        
        suggestPlaceholderValues(placeholderObj)
          .then(setSuggestions)
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, [isOpen, classData]);

  // values가 변경될 때마다 미리보기 업데이트
  useEffect(() => {
    if (classData?.template?.sceneGraph && Object.keys(values).length > 0) {
      setPreviewSceneGraph(createUpdatedSceneGraph(classData.template.sceneGraph, values));
    }
  }, [values, classData]);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const newInstance = await createInstanceFromClass(classData, values);
      onCreateInstance?.(newInstance);
      onClose();
    } catch (error) {
      console.error('인스턴스 생성 실패:', error);
      alert('인스턴스 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleValueChange = (placeholder, value) => {
    setValues(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  const handleSuggestionClick = (placeholder, suggestion) => {
    handleValueChange(placeholder, suggestion);
  };

  // 시각적 객체 노드 컴포넌트 - SceneGraphVisualizer의 ObjectNode와 똑같이
  const VisualObjectNode = ({ object, onPlaceholderClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // placeholder 여부 확인
    const hasPlaceholder = object.name.includes('{') || 
      (object.attributes && object.attributes.some(attr => attr.includes('{')));

    return (
      <div
        style={{
          border: "1px solid #fca5a5",
          borderRadius: "6px",
          padding: "5px",
          backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
          marginBottom: "0px",
          maxWidth: "90px",
          minWidth: "80px",
          boxSizing: "border-box",
          overflow: "hidden",
          cursor: hasPlaceholder ? "pointer" : "default",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Attributes */}
        <div style={{ marginBottom: "3px" }}>
          {object.attributes?.map((attr, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
                marginBottom: "2px",
                width: "100%",
              }}
            >
              <div
                style={{
                  border: "1px solid #93c5fd",
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  fontSize: "11px",
                  fontWeight: 500,
                  width: "100%",
                  maxWidth: "85px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  boxSizing: "border-box",
                  textAlign: "center",
                  cursor: attr.includes('{') ? "pointer" : "default",
                }}
                onClick={() => {
                  if (attr.includes('{')) {
                    const placeholder = attr.replace(/[{}]/g, '');
                    onPlaceholderClick(placeholder);
                  }
                }}
              >
                {attr}
              </div>
            </div>
          ))}
        </div>

        {/* Object Name */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div 
            style={{ 
              fontSize: "11px", 
              fontWeight: "500", 
              color: "#7f1d1d",
              cursor: object.name.includes('{') ? "pointer" : "default",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              if (object.name.includes('{')) {
                const placeholder = object.name.replace(/[{}]/g, '');
                onPlaceholderClick(placeholder);
              }
            }}
            title={object.name}
          >
            {object.name}
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7f1d1d",
            }}
            title="Expand"
          >
            {/* ChevronDown icon */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // RelationshipNode 컴포넌트 - SceneGraphVisualizer와 동일
  const VisualRelationshipNode = ({ relationship, objects }) => {
    const sourceObj = objects.find((obj) => obj.id === relationship.source);
    const targetObj = objects.find((obj) => obj.id === relationship.target);
    
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 6px",
          backgroundColor: "#f1f5f9",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          fontSize: "10px",
          fontWeight: "500",
          color: "#475569",
          cursor: "default",
        }}
        title={`${sourceObj?.name || relationship.source} ${relationship.relation} ${targetObj?.name || relationship.target}`}
      >
        <span style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "120px",
        }}>
          {relationship.relation || "related"}
        </span>
      </div>
    );
  };

  // DAG 기반 레벨 계산 (SceneGraphVisualizer와 동일)
  const getNodeLevels = (objects, relationships) => {
    const inDegree = {}, levels = {}, graph = {};
    objects.forEach((o) => {
      inDegree[o.id] = 0;
      graph[o.id] = [];
    });
    relationships.forEach((r) => {
      graph[r.source].push(r.target);
      inDegree[r.target]++;
    });

    const queue = [];
    objects.forEach((o) => {
      if (inDegree[o.id] === 0) {
        levels[o.id] = 0;
        queue.push(o.id);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift();
      const currentLevel = levels[current];
      for (const next of graph[current]) {
        inDegree[next]--;
        if (inDegree[next] === 0) {
          levels[next] = currentLevel + 1;
          queue.push(next);
        }
      }
    }

    return levels;
  };

  const objectPositions = useMemo(() => {
    if (!previewSceneGraph?.objects) return {};
    
    const levels = getNodeLevels(previewSceneGraph.objects, previewSceneGraph.relationships || []);
    const grouped = {};
    for (const [id, level] of Object.entries(levels)) {
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(id);
    }

    const positions = {};
    const gapX = 160; // SceneGraphVisualizer와 동일
    const gapY = 80;  // SceneGraphVisualizer와 동일

    Object.entries(grouped).forEach(([levelStr, ids], colIndex) => {
      ids.forEach((id, rowIndex) => {
        positions[id] = {
          x: colIndex * gapX,
          y: rowIndex * gapY,
        };
      });
    });

    return positions;
  }, [previewSceneGraph]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Instance from {classData?.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="loading">Loading suggestions...</div>
          ) : (
            <div style={{ display: "flex", gap: "20px" }}>
              {/* 시각적 미리보기 영역 */}
              <div style={{ flex: 2 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#374151" }}>
                  Preview
                </h4>
                <div
                  style={{
                    position: "relative",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    minHeight: "200px",
                    padding: "12px",
                    overflow: "auto",
                  }}
                >
                  {/* 연결선 그리기 */}
                  {previewSceneGraph?.relationships && (
                    <svg
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        top: 0,
                        left: 0,
                      }}
                    >
                      <defs>
                        <marker
                          id="arrowhead-preview"
                          markerWidth="6"
                          markerHeight="6"
                          refX="5"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
                        </marker>
                      </defs>
                      {previewSceneGraph.relationships.map((rel, i) => {
                        const src = objectPositions[rel.source];
                        const tgt = objectPositions[rel.target];
                        if (!src || !tgt) return null;

                        const x1 = src.x + 75; // nodeWidth와 동일
                        const y1 = src.y + 30; // nodeHeight / 2
                        const x2 = tgt.x;
                        const y2 = tgt.y + 30; // nodeHeight / 2

                        return (
                          <line
                            key={`line-${i}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#cbd5e1"
                            strokeWidth={1.5}
                            markerEnd="url(#arrowhead-preview)"
                            strokeDasharray="4"
                          />
                        );
                      })}
                    </svg>
                  )}

                  {/* 객체 노드들 */}
                  {previewSceneGraph?.objects?.map((obj) => {
                    const pos = objectPositions[obj.id];
                    if (!pos) return null;
                    
                    return (
                      <div
                        key={obj.id}
                        style={{
                          position: "absolute",
                          top: pos.y,
                          left: pos.x,
                          width: 75,
                          height: 60,
                        }}
                      >
                        <VisualObjectNode
                          object={obj}
                          onPlaceholderClick={(placeholder) => {
                            setEditingPlaceholder(placeholder);
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* RelationshipNode들 중간에 배치 */}
                  {previewSceneGraph?.relationships?.map((rel, i) => {
                    const src = objectPositions[rel.source];
                    const tgt = objectPositions[rel.target];
                    if (!src || !tgt) return null;
                    const midX = (src.x + 75 + tgt.x) / 2;
                    const midY = (src.y + tgt.y) / 2 + 30;
                    return (
                      <div
                        key={`rel-${i}`}
                        style={{
                          position: "absolute",
                          top: midY,
                          left: midX,
                          transform: "translate(-50%, -50%)",
                          pointerEvents: "auto",
                        }}
                      >
                        <VisualRelationshipNode
                          relationship={rel}
                          objects={previewSceneGraph.objects}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 편집 패널 */}
              <div style={{ flex: 1, minWidth: "250px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#374151" }}>
                  Customize Values
                </h4>
                
                {editingPlaceholder && (
                  <div className="edit-panel">
                    <div className="edit-header">
                      <span>Editing: {editingPlaceholder}</span>
                      <button 
                        onClick={() => setEditingPlaceholder(null)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "16px",
                          color: "#6b7280"
                        }}
                      >
                        ×
                      </button>
                    </div>
                    
                    <input 
                      type="text"
                      className="edit-input"
                      value={values[editingPlaceholder] || ''}
                      onChange={(e) => handleValueChange(editingPlaceholder, e.target.value)}
                      placeholder={`Enter ${editingPlaceholder}...`}
                      autoFocus
                    />
                    
                    {/* 제안된 값들 */}
                    {suggestions[editingPlaceholder] && (
                      <div className="suggestions">
                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                          Suggestions:
                        </div>
                        {suggestions[editingPlaceholder].map(suggestion => (
                          <button 
                            key={suggestion}
                            className="suggestion-button"
                            onClick={() => handleSuggestionClick(editingPlaceholder, suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 모든 placeholder 목록 */}
                <div className="placeholder-list">
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                    All Placeholders:
                  </div>
                  {Object.keys(values).map(placeholder => (
                    <div 
                      key={placeholder}
                      className={`placeholder-item ${editingPlaceholder === placeholder ? 'active' : ''}`}
                      onClick={() => setEditingPlaceholder(placeholder)}
                    >
                      <span className="placeholder-name">{placeholder}:</span>
                      <span className="placeholder-value">
                        {values[placeholder] || <em>default</em>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Instance'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 95%;
          max-width: 900px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #374151;
        }

        .modal-body {
          padding: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .edit-panel {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .edit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .edit-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 8px;
          box-sizing: border-box;
        }

        .edit-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .suggestions {
          margin-top: 8px;
        }

        .suggestion-button {
          display: block;
          width: 100%;
          margin-bottom: 4px;
          padding: 6px 8px;
          font-size: 12px;
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .suggestion-button:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .placeholder-list {
          margin-top: 12px;
        }

        .placeholder-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .placeholder-item:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }

        .placeholder-item.active {
          background-color: #dbeafe;
          border-color: #3b82f6;
        }

        .placeholder-name {
          font-weight: 500;
          color: #374151;
          font-size: 12px;
        }

        .placeholder-value {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
          border-color: #2563eb;
        }

        .btn-secondary {
          background-color: #f9fafb;
          color: #374151;
          border-color: #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
};