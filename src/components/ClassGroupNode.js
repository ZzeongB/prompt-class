
// ClassGroupNode.js
import GroupNode from "./GroupNode";

export default function ClassGroupNode(props) {
  return <GroupNode {...props} dragSourceType="class" forceType="class-group" withBackground={false} />;
}
