import type { FunctionalComponent } from 'preact'
import { useContext } from 'preact/hooks'
import type { HierarchyRectangularNode } from 'd3-hierarchy'

import type { ModuleTree, ModuleTreeLeaf } from '../../shared/types'
import { Node } from './node'
import { StaticContext } from './index'

export interface FlameGraphProps {
  root: HierarchyRectangularNode<ModuleTree | ModuleTreeLeaf>
  onNodeHover: (
    event: HierarchyRectangularNode<ModuleTree | ModuleTreeLeaf>
  ) => void
  selectedNode:
    | HierarchyRectangularNode<ModuleTree | ModuleTreeLeaf>
    | undefined
  onNodeClick: (
    node: HierarchyRectangularNode<ModuleTree | ModuleTreeLeaf>
  ) => void
}

export const FlameGraph: FunctionalComponent<FlameGraphProps> = ({
  root,
  onNodeHover,
  selectedNode,
  onNodeClick,
}) => {
  const { width, height, getModuleIds } = useContext(StaticContext)

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`}>
      {root.descendants().map((node) => {
        return (
          <Node
            key={getModuleIds(node.data).nodeUid.id}
            node={node}
            onMouseOver={onNodeHover}
            selected={selectedNode === node}
            onClick={onNodeClick}
          />
        )
      })}
    </svg>
  )
}
