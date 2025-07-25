import { useClassContext } from "../../context/ClassContext";

export const useInstanceActions = () => {
  const { createClass, duplicateInstance } = useClassContext();

  const handleCreateClass = (instanceData, onSuccess) => {
    try {
      const newClass = createClass(instanceData);
      // onSuccess?.(`Class "${newClass.name}" created successfully!`);
      return newClass;
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('Failed to create class. Please try again.');
    }
  };

  const handleDuplicateInstance = (instanceData, onAddInstance) => {
    try {
      const duplicatedInstance = duplicateInstance(instanceData);
      onAddInstance(duplicatedInstance);
      return duplicatedInstance;
    } catch (error) {
      console.error('Failed to duplicate instance:', error);
      alert('Failed to duplicate instance. Please try again.');
    }
  };

  return {
    handleCreateClass,
    handleDuplicateInstance,
  };
};