# Test Scenarios for Visual Prompting System

## Test 1. Class Board (Scene Graph Construction)

- [X] Add `Group` node and edit its label
- [X] Add `Object` node and edit its label
- [X] Add `Attribute` node and edit its label
- [X] Add `Relationship` node and edit its label

- [X] Click `Graph` button to generate scene graph
- [X] Collapse and expand a `Group` node

- [X] Drag and move nodes
    - [X] Child nodes follwo Parent
    - [X] Child node out of Parent, do not follow

- [X] Duplicate all node types (`Group`, `Object`, `Attribute`, `Relationship`)
- [X] Deleting `Group` deletes all nodes inside
- [X] Delete all node types

- [X] Convert an `Attribute` node to a blank attribute node
- [X] Save blank attribute node and verify linkage in the instance tree


## Test 2. Layout Board (Visual Layout Construction)

- [X] Drag and drop a `Group` node into the Layout Board
- [X] Force to fill in `Blank` node

- [X] Resize a `Resizable` node using resize handles
- [X] Duplicate a `Group` node
    - [ ] With different label
- [X] Delete a `Group` node
- [X] Add a new `Attribute` node and edit its label
- [X] Add a new `Relationship` node and edit its label
- [X] Move nodes and confirm their position updates correctly
    - [X] `Resizable` node follows `Group` node

## Test 2.1 TmpResizable Node (From Image Region)

- [X] Draw a `TmpResizable` node by dragging on the layout
- [ ] Generate graph from image region using caption
    - [X] Verify that the Class Graph is correctly generated
    - [ ] Verify that the Instance Tree is correctly generated

- [ ] Confirm correct linkage to newly created `Group` node
- [X] Erase an object from the image and check if `Empty` node is correctly linked

- [X] Duplicate an `Empty` node
- [X] Delete an `Empty` node
- [X] Duplicate a newly created `Group` node
- [X] Delete a newly created `Group` node

- [X] `TmpResizable` node becomes original `Resizable` node

## Test 3. Instance Tree Board

- [X] Confirm that all nodes from the Class Graph are present
- [X] Confirm that additional connected nodes not in Class Graph are included
- [X] Confirm that additional connected nodes not in Instance board are included

- [ ] Changes in Class Graphs are synced
- [X] Changes in Instance Graphs are synced

- [X] Collapse and expand a group node correctly
- [ ] Check for duplicated labels in nodes
- [ ] Ensure no unexpected or redundant nodes exist

## Test 4. Image Generation

- [X] Click the `Generate` button and verify image is generated via API
- [X] Confirm that progress bar updates correctly over time
- [X] Confirm proper error logging when generation fails
- [X] Confirm that output image matches the intended layout and captions

- [X] Convert scene graph to compositional sentences
- [X] Check if generated sentences reflect the graph meaningfully