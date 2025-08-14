import React, { useRef, useState, useEffect } from "react";
import { UI_CONFIG, LAYOUT_CONFIG } from "../../utils/layoutConstants";
import { filterOverlappingObjects, scaleDetectedObjectBbox } from "../../utils/boundingBox";

const ObjectOverlay = ({
  detectedObjects,
  nodes,
  flowToScreenPosition,
  leftOffset,
  topOffset,
  hoveredObject,
  setHoveredObject,
  onObjectClick
}) => {
  const clickTimeoutRef = useRef(null);
  const [clickedObjects, setClickedObjects] = useState(new Set());

  // Reset clicked objects when detectedObjects change (new image generated)
  useEffect(() => {
    setClickedObjects(new Set());
  }, [detectedObjects]);
  
  const handleClick = (obj, index) => {
    // Check if this object was already clicked
    if (clickedObjects.has(index)) {
      return; // Already clicked, ignore
    }
    
    // Prevent double-click by debouncing
    if (clickTimeoutRef.current) {
      return; // Already processing a click
    }
    
    // Mark this object as clicked
    setClickedObjects(prev => new Set(prev).add(index));
    
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null;
    }, 500); // 500ms debounce period
    
    // Call onObjectClick and clear clicked objects after it completes
    Promise.resolve(onObjectClick(obj)).then(() => {
      setClickedObjects(new Set());
    });
  };

  const filteredObjects = filterOverlappingObjects(
    detectedObjects,
    nodes,
    flowToScreenPosition,
    leftOffset,
    topOffset
  );

  return (
    <>
      {filteredObjects.map((obj, index) => {
        const scaledBbox = scaleDetectedObjectBbox(obj.bbox, LAYOUT_CONFIG.SCALE_FACTOR);
        const isClicked = clickedObjects.has(index);

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${(scaledBbox[0] / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
              top: `${(scaledBbox[1] / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
              width: `${((scaledBbox[2] - scaledBbox[0]) / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
              height: `${((scaledBbox[3] - scaledBbox[1]) / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
              border: isClicked ? "2px solid #6c757d" : UI_CONFIG.BOUNDING_BOX_BORDER,
              backgroundColor: isClicked ? "rgba(108, 117, 125, 0.3)" : UI_CONFIG.BOUNDING_BOX_BACKGROUND,
              cursor: isClicked ? "not-allowed" : "pointer",
              opacity: isClicked ? 0.6 : 1,
              zIndex: 10,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={() => !isClicked && setHoveredObject(index)}
            onMouseLeave={() => setHoveredObject(null)}
            onClick={() => handleClick(obj, index)}
            title={isClicked ? "Already processed" : `${obj.label} (${(obj.confidence * 100).toFixed(1)}%)`}
          >
            {hoveredObject === index && !isClicked && (
              <div
                style={{
                  position: "absolute",
                  top: "-25px",
                  left: "0",
                  backgroundColor: "#333",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  zIndex: 20,
                }}
              >
                {obj.label} ({(obj.confidence * 100).toFixed(1)}%)
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default ObjectOverlay;