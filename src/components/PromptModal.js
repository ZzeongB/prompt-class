import React, { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";

export default function PromptModal({ title, defaultValue = "", onSubmit, onCancel, placeholder = "Enter text..." }) {
  const [input, setInput] = useState(defaultValue);
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef(null);

  // 마운트 애니메이션
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 자동 포커스
  useEffect(() => {
    if (inputRef.current) {
      // 약간의 딜레이를 두고 포커스
      const timer = setTimeout(() => {
        inputRef.current.focus();
        inputRef.current.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = () => {
    setIsVisible(false);
    setTimeout(() => onSubmit(input), 150);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => onCancel(), 150);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `rgba(0, 0, 0, ${isVisible ? '0.6' : '0'})`,
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderRadius: "12px",
          padding: "16px",
          width: "280px",
          maxWidth: "90vw",
          boxShadow: isVisible 
            ? "0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)" 
            : "0 0 0 0 rgba(0, 0, 0, 0)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.95) translateY(10px)",
          opacity: isVisible ? 1 : 0,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}>
          <h3 style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: "600",
            color: "#1f2937",
            letterSpacing: "-0.025em",
          }}>
            {title}
          </h3>
          <button
            onClick={handleCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f3f4f6";
              e.target.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#6b7280";
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* 입력 필드 */}
        <div style={{ marginBottom: "16px" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === "Escape") {
                handleCancel();
              }
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "11px",
              fontFamily: "inherit",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              outline: "none",
              transition: "all 0.15s ease",
              backgroundColor: "#ffffff",
              color: "#1f2937",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* 버튼 그룹 */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: "6px 12px",
              fontSize: "10px",
              fontWeight: "500",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              background: "#ffffff",
              color: "#6b7280",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#d1d5db";
              e.target.style.backgroundColor = "#f9fafb";
              e.target.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.color = "#6b7280";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            style={{
              padding: "6px 12px",
              fontSize: "10px",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              background: input.trim() 
                ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" 
                : "#e5e7eb",
              color: input.trim() ? "#ffffff" : "#9ca3af",
              cursor: input.trim() ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onMouseEnter={(e) => {
              if (input.trim()) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 8px 20px -5px rgba(59, 130, 246, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            <Check size={12} />
            OK
          </button>
        </div>

        {/* 키보드 힌트 */}
        <div style={{
          marginTop: "10px",
          fontSize: "9px",
          color: "#9ca3af",
          textAlign: "center",
        }}>
          Press <kbd style={{
            padding: "1px 4px",
            backgroundColor: "#f3f4f6",
            borderRadius: "3px",
            fontFamily: "monospace",
            fontSize: "8px",
          }}>Enter</kbd> to confirm, <kbd style={{
            padding: "1px 4px",
            backgroundColor: "#f3f4f6",
            borderRadius: "3px",
            fontFamily: "monospace",
            fontSize: "8px",
          }}>Esc</kbd> to cancel
        </div>
      </div>
    </div>
  );
}