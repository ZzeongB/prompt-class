import React, { useState, useEffect } from "react";
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
  
  const { createInstanceFromClass } = useClassContext();

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen && classData?.placeholders) {
      setValues({});
      setIsLoading(true);
      
      // 클래스의 placeholder들에 대한 제안 가져오기
      suggestPlaceholderValues(classData.placeholders)
        .then(setSuggestions)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, classData]);

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

  const handleValueChange = (category, value) => {
    setValues(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSuggestionClick = (category, suggestion) => {
    handleValueChange(category, suggestion);
  };

  if (!isOpen) return null;

  // 고유한 카테고리들 추출
  const categories = classData?.placeholders 
    ? [...new Set(Object.values(classData.placeholders))]
    : [];

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
            categories.map(category => (
              <div key={category} className="input-group">
                <label className="input-label">
                  {category.charAt(0).toUpperCase() + category.slice(1)}:
                </label>
                
                <input 
                  type="text"
                  className="input-field"
                  value={values[category] || ''}
                  onChange={(e) => handleValueChange(category, e.target.value)}
                  placeholder={`Enter ${category}...`}
                />
                
                {/* 제안된 값들 */}
                {suggestions[category] && (
                  <div className="suggestions">
                    {suggestions[category].map(suggestion => (
                      <button 
                        key={suggestion}
                        className="suggestion-button"
                        onClick={() => handleSuggestionClick(category, suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            disabled={isCreating || categories.length === 0}
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
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
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
          padding: 20px;
          color: #6b7280;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .input-field {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .suggestions {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .suggestion-button {
          padding: 4px 8px;
          font-size: 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-button:hover {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 8px 16px;
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