import { createContext, render } from 'preact'
import type { HierarchyNode, PartitionLayout } from 'd3-hierarchy'
import { hierarchy, partition } from 'd3-hierarchy'
import type {
  ModuleLengths,
  ModuleTree,
  ModuleTreeLeaf,
  SizeKey,
  VisualizerData,
} from '../../src/shared/types'
import { isModuleTree } from '../../src/shared/types'

import type { Id } from '../uid'
import { generateUniqueId } from '../uid'
import { getAvailableSizeOptions } from '../sizes'
import { Main } from './main'
import type { NodeColorGetter } from './color'
import createRainbowColor from './color'

import '../style/style-flamegraph.scss'
import { PADDING } from './const'

export interface StaticData {
  data: VisualizerData
  availableSizeProperties: SizeKey[]
  width: number
  height: number
}

export interface ModuleIds {
  nodeUid: Id
  clipUid: Id
}

export interface ChartData {
  layout: PartitionLayout<ModuleTree | ModuleTreeLeaf>
  rawHierarchy: HierarchyNode<ModuleTree | ModuleTreeLeaf>
  getModuleSize: (
    node: ModuleTree | ModuleTreeLeaf,
    sizeKey: SizeKey
  ) => number
  getModuleIds: (node: ModuleTree | ModuleTreeLeaf) => ModuleIds
  getModuleColor: NodeColorGetter
}

export type Context = StaticData & ChartData

export const StaticContext = createContext<Context>({} as unknown as Context)

function drawChart(
  parentNode: Element,
  data: VisualizerData,
  width: number,
  height: number,
): void {
  const availableSizeProperties = getAvailableSizeOptions(data.options)

  // eslint-disable-next-line no-console
  console.time('layout create')

  const layout = partition<ModuleTree | ModuleTreeLeaf>()
    .size([width, height])
    .padding(PADDING)
    .round(true)

  // eslint-disable-next-line no-console
  console.timeEnd('layout create')

  // eslint-disable-next-line no-console
  console.time('rawHierarchy create')
  const rawHierarchy = hierarchy<ModuleTree | ModuleTreeLeaf>(data.tree)
  // eslint-disable-next-line no-console
  console.timeEnd('rawHierarchy create')

  const nodeSizesCache = new Map<ModuleTree | ModuleTreeLeaf, ModuleLengths>()

  const nodeIdsCache = new Map<ModuleTree | ModuleTreeLeaf, ModuleIds>()

  const getModuleSize = (node: ModuleTree | ModuleTreeLeaf, sizeKey: SizeKey) =>
    nodeSizesCache.get(node)?.[sizeKey] ?? 0

  // eslint-disable-next-line no-console
  console.time('rawHierarchy eachAfter cache')
  rawHierarchy.eachAfter((node) => {
    const nodeData = node.data

    nodeIdsCache.set(nodeData, {
      nodeUid: generateUniqueId('node'),
      clipUid: generateUniqueId('clip'),
    })

    const sizes: ModuleLengths = {
      renderedLength: 0,
      gzipLength: 0,
      brotliLength: 0,
    }
    if (isModuleTree(nodeData)) {
      for (const sizeKey of availableSizeProperties) {
        sizes[sizeKey] = nodeData.children.reduce(
          (acc, child) => getModuleSize(child, sizeKey) + acc,
          0,
        )
      }
    }
    else {
      for (const sizeKey of availableSizeProperties)
        sizes[sizeKey] = data.nodeParts[nodeData.uid][sizeKey] ?? 0
    }
    nodeSizesCache.set(nodeData, sizes)
  })
  // eslint-disable-next-line no-console
  console.timeEnd('rawHierarchy eachAfter cache')

  const getModuleIds = (node: ModuleTree | ModuleTreeLeaf) =>
    nodeIdsCache.get(node) as ModuleIds

  // eslint-disable-next-line no-console
  console.time('color')
  const getModuleColor = createRainbowColor(rawHierarchy)
  // eslint-disable-next-line no-console
  console.timeEnd('color')

  render(
    <StaticContext.Provider
      value={{
        data,
        availableSizeProperties,
        width,
        height,
        getModuleSize,
        getModuleIds,
        getModuleColor,
        rawHierarchy,
        layout,
      }}
    >
      <Main />
    </StaticContext.Provider>,
    parentNode,
  )
}

export default drawChart
