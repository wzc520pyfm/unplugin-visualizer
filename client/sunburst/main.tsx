import type { HierarchyRectangularNode } from 'd3-hierarchy'
import type { FunctionalComponent } from 'preact'
import { useContext, useMemo, useState } from 'preact/hooks'

import type { ModuleTree, ModuleTreeLeaf, SizeKey } from '../../shared/types'
import { isModuleTree } from '../../shared/types'

import { SideBar } from '../sidebar'
import { useFilter } from '../use-filter'
import { Chart } from './chart'

import { StaticContext } from './index'

export const Main: FunctionalComponent = () => {
  const { availableSizeProperties, rawHierarchy, getModuleSize, layout, data }
    = useContext(StaticContext)

  const [sizeProperty, setSizeProperty] = useState<SizeKey>(
    availableSizeProperties[0],
  )

  const [selectedNode, setSelectedNode] = useState<
    HierarchyRectangularNode<ModuleTree | ModuleTreeLeaf> | undefined
  >(undefined)

  const { getModuleFilterMultiplier, setExcludeFilter, setIncludeFilter }
    = useFilter()

  const getNodeSizeMultiplier = useMemo(() => {
    if (selectedNode === undefined) {
      return (): number => 1
    }
    else if (isModuleTree(selectedNode.data)) {
      const descendants = new Set(
        selectedNode.descendants().map(d => d.data),
      )
      return (node: ModuleTree | ModuleTreeLeaf): number => {
        if (descendants.has(node))
          return 3

        return 1
      }
    }
    else {
      return (node: ModuleTree | ModuleTreeLeaf): number => {
        if (node === selectedNode.data)
          return 3

        return 1
      }
    }
  }, [selectedNode])

  // root here always be the same as rawHierarchy even after layouting
  const root = useMemo(() => {
    const rootWithSizesAndSorted = rawHierarchy
      .sum((node) => {
        if (isModuleTree(node))
          return 0

        const meta = data.nodeMetas[data.nodeParts[node.uid].metaUid]
        // eslint-disable-next-line ts/no-non-null-asserted-optional-chain
        const bundleId = Object.entries(meta.moduleParts).find(
          // eslint-disable-next-line unused-imports/no-unused-vars, eqeqeq
          ([bundleId, uid]) => uid == node.uid,
        )?.[0]!

        const ownSize = getModuleSize(node, sizeProperty)
        const zoomMultiplier = getNodeSizeMultiplier(node)
        const filterMultiplier = getModuleFilterMultiplier(bundleId, meta)

        return ownSize * zoomMultiplier * filterMultiplier
      })
      .sort(
        (a, b) =>
          getModuleSize(a.data, sizeProperty)
          - getModuleSize(b.data, sizeProperty),
      )

    return layout(rootWithSizesAndSorted)
  }, [
    data,
    getModuleFilterMultiplier,
    getModuleSize,
    getNodeSizeMultiplier,
    layout,
    rawHierarchy,
    sizeProperty,
  ])

  return (
    <>
      <SideBar
        sizeProperty={sizeProperty}
        availableSizeProperties={availableSizeProperties}
        setSizeProperty={setSizeProperty}
        onExcludeChange={setExcludeFilter}
        onIncludeChange={setIncludeFilter}
      />
      <Chart
        root={root}
        sizeProperty={sizeProperty}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
      />
    </>
  )
}
