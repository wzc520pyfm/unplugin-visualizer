import type { HierarchyRectangularNode } from 'd3-hierarchy'
import type { FunctionalComponent } from 'preact'
import type { ModuleTree, ModuleTreeLeaf } from '../../src/shared/types'
import color from '../color'

type NodeEventHandler = (
  event: HierarchyRectangularNode<ModuleTree | ModuleTreeLeaf>
) => void

export interface NodeProps {
  node: HierarchyRectangularNode<ModuleTree | ModuleTreeLeaf>
  onMouseOver: NodeEventHandler
  path: string
  highlighted: boolean
  selected: boolean
  onClick: NodeEventHandler
}

export const Node: FunctionalComponent<NodeProps> = ({
  node,
  onMouseOver,
  onClick,
  path,
  highlighted,
  selected,
}) => {
  return (
    <path
      className="node"
      d={path}
      fill-rule="evenodd"
      stroke="#fff"
      fill={color(node)}
      onMouseOver={(evt: MouseEvent) => {
        evt.stopPropagation()
        onMouseOver(node)
      }}
      onClick={(evt: MouseEvent) => {
        evt.stopPropagation()
        onClick(node)
      }}
      opacity={highlighted ? 1 : 0.3}
      stroke-width={selected ? 3 : undefined}
    />
  )
}
