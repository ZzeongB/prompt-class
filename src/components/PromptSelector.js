import React, { useState } from 'react';
import promptData from '../data/promptData.json';

const PromptSelector = ({ onPromptSelect, selectedPromptId }) => {
  const [hoveredPrompt, setHoveredPrompt] = useState(null);

  const handlePromptClick = (prompt) => {
    onPromptSelect(prompt);
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        maxHeight: '600px',
        overflowY: 'auto'
      }}
    >
      <h3
        style={{
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1e293b'
        }}
      >
        Select a Prompt to Evaluate
      </h3>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '12px'
        }}
      >
        {promptData.map((prompt) => (
          <div
            key={prompt.id}
            onClick={() => handlePromptClick(prompt)}
            onMouseEnter={() => setHoveredPrompt(prompt.id)}
            onMouseLeave={() => setHoveredPrompt(null)}
            style={{
              padding: '16px',
              backgroundColor: selectedPromptId === prompt.id ? '#dbeafe' : '#ffffff',
              border: selectedPromptId === prompt.id 
                ? '2px solid #3b82f6' 
                : hoveredPrompt === prompt.id 
                  ? '2px solid #cbd5e1' 
                  : '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: hoveredPrompt === prompt.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '8px'
              }}
            >
              {prompt.title}
            </div>
            
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '8px',
                lineHeight: '1.4'
              }}
            >
              {prompt.globalCaption}
            </div>
            
            <div
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{prompt.instances.length} objects</span>
              <span>{prompt.sceneGraph.relationships.length} relationships</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptSelector;