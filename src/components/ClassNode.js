// ClassNode.js
import BaseNode from "./BaseNode";

export default function ClassNode({ id, data }) {
  return <BaseNode id={id} data={data} nodeType="class" />;
}
