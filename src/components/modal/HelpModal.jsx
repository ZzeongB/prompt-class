// components/HelpModal.jsx
import React from "react";

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "20px",
          maxWidth: "600px",
          width: "90%",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()} // 바깥 클릭 시만 닫히도록
      >
        <h2 style={{ marginTop: 0 }}>도움말</h2>
        <p>여기에 시스템 사용법이나 가이드 내용을 적어주세요.</p>
        <button
          onClick={onClose}
          style={{
            marginTop: "16px",
            padding: "8px 12px",
            background: "#eee",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
