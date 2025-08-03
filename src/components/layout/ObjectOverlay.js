import React from "react";
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

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${(scaledBbox[0] / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
              top: `${(scaledBbox[1] / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
              width: `${((scaledBbox[2] - scaledBbox[0]) / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
              height: `${((scaledBbox[3] - scaledBbox[1]) / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
              border: UI_CONFIG.BOUNDING_BOX_BORDER,
              backgroundColor: UI_CONFIG.BOUNDING_BOX_BACKGROUND,
              cursor: "pointer",
              zIndex: 10,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={() => setHoveredObject(index)}
            onMouseLeave={() => setHoveredObject(null)}
            onClick={() => onObjectClick(obj)}
            title={`${obj.label} (${(obj.confidence * 100).toFixed(1)}%)`}
          >
            {hoveredObject === index && (
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