import { useContext, useMemo, useState } from 'preact/hooks'
import type { HierarchyRectangularNode } from 'd3-hierarchy'

import type { FunctionalComponent } from 'preact'
import { SideBar } from '../sidebar'
import type {
  ModuleTree,
  ModuleTreeLeaf,
  SizeKey,
} from '../../src/shared/types'
import { isModuleTree } from '../../src/shared/types'
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

  // eslint-disable-next-line no-console
  console.time('getNodeSizeMultiplier')
  const getNodeSizeMultiplier = useMemo(() => {
    const selectedMultiplier = 1 // selectedSize < rootSize * increaseFactor ? (rootSize * increaseFactor) / selectedSize : rootSize / selectedSize;
    const nonSelectedMultiplier = 0 // 1 / selectedMultiplier

    if (selectedNode === undefined) {
      return (): number => 1
    }
    else if (isModuleTree(selectedNode.data)) {
      const leaves = new Set(selectedNode.leaves().map(d => d.data))
      return (node: ModuleTree | ModuleTreeLeaf): number => {
        if (leaves.has(node))
          return selectedMultiplier

        return nonSelectedMultiplier
      }
    }
    else {
      return (node: ModuleTree | ModuleTreeLeaf): number => {
        if (node === selectedNode.data)
          return selectedMultiplier

        return nonSelectedMultiplier
      }
    }
  }, [getModuleSize, rawHierarchy.data, selectedNode, sizeProperty])
  // eslint-disable-next-line no-console
  console.timeEnd('getNodeSizeMultiplier')

  // eslint-disable-next-line no-console
  console.time('root hierarchy compute')
  // root here always be the same as rawHierarchy even after layouting
  const root = useMemo(() => {
    const rootWithSizesAndSorted = rawHierarchy
      .sum((node) => {
        if (isModuleTree(node))
          return 0

        const meta = data.nodeMetas[data.nodeParts[node.uid].metaUid]
        // eslint-disable-next-line ts/no-non-null-asserted-optional-chain
        const bundleId = Object.entries(meta.moduleParts).find(
          // eslint-disable-next-line eqeqeq, unused-imports/no-unused-vars
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

  // eslint-disable-next-line no-console
  console.timeEnd('root hierarchy compute')

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
