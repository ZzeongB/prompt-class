// InstanceBoard.js - 모든 인스턴스 상세 정보 표시
import React, { useState, useEffect } from "react";
import { useClassContext } from "../context/ClassContext";
import InstanceCard from "../components/InstanceCard";
import { Plus, Search, Filter, Grid, List } from "lucide-react";
import CustomButton from "../components/CustomButton";
import { logEvent } from "../api/logEvent";

export default function InstanceBoard({
  selectedInstanceId,
  onInstanceSelect,
}) {
  const { instances, classes } = useClassContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, class, standalone
  const [sortBy, setSortBy] = useState("recent"); // recent, name, type
  const [viewMode, setViewMode] = useState("grid"); // grid, list

  // 선택된 인스턴스로 스크롤
  useEffect(() => {
    if (selectedInstanceId) {
      const element = document.getElementById(`instance-card-${selectedInstanceId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });

        const instance = instances.find(i => i.id === selectedInstanceId);
        logEvent("instance_selected", {
          instance_id: selectedInstanceId,
          instance_label: instance?.instanceLabel,
          is_from_class: instance?.isFromClass,
          class_id: instance?.classId
        });
      }
    }
  }, [selectedInstanceId, instances]);

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
        // height: "100vh",
        backgroundColor: "#f8fafc",
        borderLeft: "1px solid #e2e8f0",
        padding: "16px",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={(e) => {
        // 배경 클릭 시 선택 해제 (이벤트 버블링 방지)
        if (e.target === e.currentTarget) {
          logEvent("instance_deselected", {
            previous_instance_id: selectedInstanceId
          });
          onInstanceSelect?.(null);
        }
      }}
    >
      {/* 헤더 및 컨트롤 */}
      {/* <div
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
      </div> */}

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
        onClick={(e) => {
          // 빈 공간 클릭 시 선택 해제
          if (e.target === e.currentTarget) {
            onInstanceSelect?.(null);
          }
        }}
      >
        {filteredAndSortedInstances.map((instance) => (
          <div key={instance.id} id={`instance-card-${instance.id}`}>
            <InstanceCard
              instance={instance}
              classes={classes}
              isSelected={selectedInstanceId === instance.id}
              onSelect={() => {
                onInstanceSelect?.(instance.id);
              }}
              viewMode={viewMode}
            />
          </div>
        ))}

        {filteredAndSortedInstances.length === 0 && (
          <div>
            {searchTerm || filterType !== "all" ? (
              "No instances match your search criteria"
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                  padding: "40px 20px",
                  fontStyle: "italic",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                No instances yet.
                <br />
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Create an instance by clicking "Create New Box"!
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
