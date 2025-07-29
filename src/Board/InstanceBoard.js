// InstanceBoard.js - 모든 인스턴스 상세 정보 표시
import React, { useState, useEffect } from "react";
import { useClassContext } from "../context/ClassContext";
import InstanceCard from "../components/InstanceCard";
import { Plus, Search, Filter, Grid, List } from "lucide-react";
import CustomButton from "../components/CustomButton";

export default function InstanceBoard({
  selectedInstanceId,
  onInstanceSelect,
}) {
  const { instances, classes } = useClassContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, class, standalone
  const [sortBy, setSortBy] = useState("recent"); // recent, name, type
  const [viewMode, setViewMode] = useState("grid"); // grid, list

  const filteredAndSortedInstances = instances
    .filter((instance) => {
      // 검색 필터
      const matchesSearch =
        instance.instanceLabel
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        instance.textDescription
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // 타입 필터
      const matchesType =
        filterType === "all" ||
        (filterType === "class" && instance.isFromClass) ||
        (filterType === "standalone" && !instance.isFromClass);

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.instanceLabel.localeCompare(b.instanceLabel);
        case "type":
          return (b.isFromClass ? 1 : 0) - (a.isFromClass ? 1 : 0);
        case "recent":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  return (
    <div
      style={{
        height: "100vh",
          backgroundColor: "#f8fafc",
          borderLeft: "1px solid #e2e8f0",
          padding: "16px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
      }}
    >
      {/* 헤더 및 컨트롤 */}
      <div
        style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#1e293b",
          marginBottom: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          paddingBottom: "12px",
          borderBottom: "2px solid #e2e8f0",
        }}
      >
        Instance Library
      </div>

      {/* 인스턴스 카드들 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          gridTemplateColumns:
            viewMode === "grid"
              ? "repeat(auto-fill, minmax(300px, 1fr))"
              : "none",
          flexDirection: viewMode === "list" ? "column" : "none",
          gap: "16px",
          paddingRight: "8px", // 스크롤바 공간
        }}
      >
        {filteredAndSortedInstances.map((instance) => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            classes={classes}
            isSelected={selectedInstanceId === instance.id}
            onSelect={() => onInstanceSelect(instance.id)}
            viewMode={viewMode}
          />
        ))}

        {filteredAndSortedInstances.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "40px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
              border: "2px dashed #d1d5db",
              borderRadius: "8px",
            }}
          >
            {searchTerm || filterType !== "all"
              ? "No instances match your search criteria"
              : "No instances created yet. Create one from the Layout Board!"}
          </div>
        )}
      </div>
    </div>
  );
}
