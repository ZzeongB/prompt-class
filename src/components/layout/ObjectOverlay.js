import { useRef, useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { UI_CONFIG, LAYOUT_CONFIG } from "../../utils/layoutConstants";
import { filterOverlappingObjects, scaleDetectedObjectBbox } from "../../utils/boundingBox";
import { ToolbarButton } from "../nodeComponents/NodeToolbarMenu";

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
  const [ignoredObjects, setIgnoredObjects] = useState(new Set());

  // Reset clicked and ignored objects when detectedObjects change (new image generated)
  useEffect(() => {
    setClickedObjects(new Set());
    setIgnoredObjects(new Set());
  }, [detectedObjects]);

  const handleConvertToPrompt = (obj, index) => {
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

  const handleIgnore = (index) => {
    setIgnoredObjects(prev => new Set(prev).add(index));
    setHoveredObject(null);
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
        const isIgnored = ignoredObjects.has(index);
        const isHovered = hoveredObject === index;

        // Don't render ignored objects
        if (isIgnored) {
          return null;
        }

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
              cursor: isClicked ? "not-allowed" : "default",
              opacity: isClicked ? 0.6 : 1,
              zIndex: 10,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={() => !isClicked && setHoveredObject(index)}
            onMouseLeave={() => setHoveredObject(null)}
          >
            {isHovered && !isClicked && (
              <div
                style={{
                  position: "absolute",
                  top: "-48px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 8px",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "10px",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  zIndex: 20,
                  minHeight: "40px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={() => setHoveredObject(index)}
                onMouseLeave={() => setHoveredObject(null)}
              >
                <span style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#334155",
                  paddingLeft: "4px",
                  paddingRight: "8px"
                }}>
                  {obj.label} ({(obj.confidence * 100).toFixed(0)}%)
                </span>

                <ToolbarButton
                  title="Convert to prompt"
                  icon={<Check size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConvertToPrompt(obj, index);
                  }}
                  tooltipPosition="top"
                />

                <ToolbarButton
                  title="Ignore this detection"
                  icon={<X size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIgnore(index);
                  }}
                  danger={true}
                  tooltipPosition="top"
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default ObjectOverlay;