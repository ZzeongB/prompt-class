import React from "react";
import { Trash2 } from "lucide-react";

const DeleteButton = ({ onClick, size = 10, title = "Delete" }) => (
  <button
    onClick={onClick}
    style={{
      background: "#fee2e2",
      border: "1px solid #fca5a5",
      borderRadius: "3px",
      width: "18px",
      height: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    }}
    title={title}
  >
    <div>
      {" "}
      <Trash2 size={size} color="#dc2626" />
    </div>
  </button>
);

export default DeleteButton;
