export type SizeKey = 'renderedLength' | 'gzipLength' | 'brotliLength'

export function isModuleTree(mod: ModuleTree | ModuleTreeLeaf): mod is ModuleTree {
  return 'children' in mod
}

export type ModuleUID = string
export type BundleId = string

export interface ModuleTreeLeaf {
  name: string
  uid: ModuleUID
}

export interface ModuleTree {
  name: string
  children: Array<ModuleTree | ModuleTreeLeaf>
}

export type ModulePart = {
  metaUid: ModuleUID
} & ModuleLengths

export interface ModuleImport {
  uid: ModuleUID
  dynamic?: boolean
}

export interface ModuleMeta {
  moduleParts: Record<BundleId, ModuleUID>
  importedBy: ModuleImport[]
  imported: ModuleImport[]
  isEntry?: boolean
  isExternal?: boolean
  id: string
}

export interface ModuleLengths {
  renderedLength: number
  gzipLength: number
  brotliLength: number
}

export interface VisualizerData {
  version: number
  tree: ModuleTree
  nodeParts: Record<ModuleUID, ModulePart>
  nodeMetas: Record<ModuleUID, ModuleMeta>
  env: {
    [key: string]: unknown
  }
  options: {
    gzip: boolean
    brotli: boolean
    sourcemap: boolean
  }
}
