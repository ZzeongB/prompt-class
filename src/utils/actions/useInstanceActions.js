import { useClassContext } from "../../context/ClassContext";

export const useInstanceActions = () => {
  const { createClass, duplicateInstance } = useClassContext();

  const handleCreateClass = async (sceneData, onMessage) => {
    try {
      // 데이터 검증
      if (!sceneData) {
        throw new Error("Scene data is null or undefined");
      }

      if (!sceneData.instanceLabel) {
        throw new Error("Instance label is missing");
      }

      // ClassContext의 createClass 함수 사용
      const newClass = await createClass({
        instanceLabel: sceneData.instanceLabel,
        sceneGraph: sceneData.sceneGraph || {},
        textDescription: sceneData.textDescription || "",
        id: sceneData.id
      });
    } catch (error) {
      console.error("Error in handleCreateClass:", error);
    }
  };

  const handleDuplicateInstance = async (sceneData, onMessage) => {
    try {
      if (!sceneData) {
        throw new Error("Scene data is null or undefined");
      }

      const duplicated = duplicateInstance({
        instanceLabel: sceneData.instanceLabel,
        sceneGraph: sceneData.sceneGraph || {},
        textDescription: sceneData.textDescription || "",
        isFromClass: sceneData.isFromClass || false,
      });

      return duplicated;
    } catch (error) {
      console.error("Error in handleDuplicateInstance:", error);
    }
  };

  return {
    handleCreateClass,
    handleDuplicateInstance,
  };
};
