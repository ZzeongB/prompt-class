// InstanceNode.js
import BaseNode from "./BaseNode";

export default function InstanceNode({ id, data }) {
;
  return <BaseNode id={id} data={data} nodeType="instance" />;
}
