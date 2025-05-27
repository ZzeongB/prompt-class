// InstanceGroupNode.js
import GroupNode from "./GroupNode";

export default function InstanceGroupNode(props) {
  return <GroupNode {...props} dragSourceType="instance" withBackground={true} />;
}
