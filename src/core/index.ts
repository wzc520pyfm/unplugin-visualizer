import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import buffer from 'node:buffer'

import type { EmittedFile, GetModuleInfo, NormalizedOutputOptions, OutputBundle, OutputOptions, PluginContextMeta, RollupError, RollupLog } from 'rollup'
import opn from 'open'

import type { ModuleLengths, ModuleTree, ModuleTreeLeaf, VisualizerData } from '../../shared/types'
import { createFilter } from '../../shared/create-filter'
import type { Options as PluginVisualizerOptions } from '../types'
import { version } from './version'

import type { SizeGetter } from './compress'
import { createBrotliSizeGetter, createGzipSizeGetter } from './compress'

import { ModuleMapper, replaceHashPlaceholders } from './module-mapper'
import { addLinks, buildTree, mergeTrees } from './data'
import { getSourcemapModules } from './sourcemap'
import { renderTemplate } from './render-template'

const WARN_SOURCEMAP_DISABLED
  = 'rollup output configuration missing sourcemap = true. You should add output.sourcemap = true or disable sourcemap in this plugin'

const WARN_SOURCEMAP_MISSING = (id: string) => `${id} missing source map`

const WARN_JSON_DEPRECATED = 'Option `json` deprecated, please use template: "raw-data"'

const ERR_FILENAME_EMIT = 'When using emitFile option, filename must not be path but a filename'

const defaultSizeGetter: SizeGetter = () => Promise.resolve(0)

function chooseDefaultFileName(pluginOpts: PluginVisualizerOptions) {
  if (pluginOpts.filename)
    return pluginOpts.filename

  if (pluginOpts.json || pluginOpts.template === 'raw-data')
    return 'stats.json'

  if (pluginOpts.template === 'list')
    return 'stats.yml'

  return 'stats.html'
}

// TODO: need to change common for all pack util
interface Context {
  warn: (log: RollupLog | string | (() => RollupLog | string)) => void
  error: (error: RollupError | string) => never
  getModuleInfo: GetModuleInfo
  meta: PluginContextMeta
  emitFile: (emittedFile: EmittedFile) => string
}

export async function visualizer<T extends Context = Context>(
  this: T,
  pluginOpts: PluginVisualizerOptions | ((outputOptions: OutputOptions) => PluginVisualizerOptions) | undefined = {},
  outputOptions: NormalizedOutputOptions,
  outputBundle: OutputBundle,
): Promise<void> {
  pluginOpts = typeof pluginOpts === 'function' ? pluginOpts(outputOptions) : pluginOpts

  if ('json' in pluginOpts) {
    this.warn(WARN_JSON_DEPRECATED)
    if (pluginOpts.json)
      pluginOpts.template = 'raw-data'
  }
  const filename = pluginOpts.filename ?? chooseDefaultFileName(pluginOpts)
  const title = pluginOpts.title ?? 'Rollup Visualizer'

  const open = !!pluginOpts.open
  const openOptions = pluginOpts.openOptions ?? {}

  const template = pluginOpts.template ?? 'treemap'
  const projectRoot = pluginOpts.projectRoot ?? process.cwd()

  const filter = createFilter(pluginOpts.include, pluginOpts.exclude)

  const gzipSize = !!pluginOpts.gzipSize && !pluginOpts.sourcemap
  const brotliSize = !!pluginOpts.brotliSize && !pluginOpts.sourcemap
  const gzipSizeGetter = gzipSize
    ? createGzipSizeGetter(typeof pluginOpts.gzipSize === 'object' ? pluginOpts.gzipSize : {})
    : defaultSizeGetter
  const brotliSizeGetter = brotliSize
    ? createBrotliSizeGetter(typeof pluginOpts.brotliSize === 'object' ? pluginOpts.brotliSize : {})
    : defaultSizeGetter

  const getModuleLengths = async (
    {
      id,
      renderedLength,
      code,
    }: {
      id: string
      renderedLength: number
      code: string | null
    },
    useRenderedLength: boolean = false,
  ): Promise<ModuleLengths & { id: string }> => {
    // eslint-disable-next-line eqeqeq
    const isCodeEmpty = code == null || code == ''

    const result = {
      id,
      gzipLength: isCodeEmpty ? 0 : await gzipSizeGetter(code),
      brotliLength: isCodeEmpty ? 0 : await brotliSizeGetter(code),
      renderedLength: useRenderedLength
        ? renderedLength
        : isCodeEmpty
          ? 0
          : buffer.Buffer.byteLength(code, 'utf-8'),
    }
    return result
  }

  if (pluginOpts.sourcemap && !outputOptions.sourcemap)
    this.warn(WARN_SOURCEMAP_DISABLED)

  const roots: Array<ModuleTree | ModuleTreeLeaf> = []
  const mapper = new ModuleMapper(projectRoot)

  // collect trees
  for (const [bundleId, bundle] of Object.entries(outputBundle)) {
    if (bundle.type !== 'chunk')
      continue // only chunks

    let tree: ModuleTree

    if (pluginOpts.sourcemap) {
      if (!bundle.map)
        this.warn(WARN_SOURCEMAP_MISSING(bundleId))

      const modules = await getSourcemapModules(
        bundleId,
        bundle,
        outputOptions.dir
        ?? (outputOptions.file && path.dirname(outputOptions.file))
        ?? process.cwd(),
      )

      const moduleRenderInfo = await Promise.all(
        Object.values(modules)
          .filter(({ id }) => filter(bundleId, id))
          .map(({ id, renderedLength, code }) => {
            return getModuleLengths({ id, renderedLength, code: code.join('') }, true)
          }),
      )

      tree = buildTree(bundleId, moduleRenderInfo, mapper)
    }
    else {
      const modules = await Promise.all(
        Object.entries(bundle.modules)
          .filter(([id]) => filter(bundleId, id))
          .map(
            ([id, { renderedLength, code }]) => getModuleLengths({ id, renderedLength, code }),
            false,
          ),
      )

      tree = buildTree(bundleId, modules, mapper)
    }

    if (tree.children.length === 0) {
      const bundleSizes = await getModuleLengths(
        {
          id: bundleId,
          renderedLength: bundle.code.length,
          code: bundle.code,
        },
        false,
      )

      const facadeModuleId = bundle.facadeModuleId ?? `${bundleId}-unknown`
      const bundleUid = mapper.setNodePart(bundleId, facadeModuleId, bundleSizes)
      mapper.setNodeMeta(facadeModuleId, { isEntry: true })
      const leaf: ModuleTreeLeaf = { name: bundleId, uid: bundleUid }
      roots.push(leaf)
    }
    else {
      roots.push(tree)
    }
  }

  // after trees we process links (this is mostly for uids)
  for (const [, bundle] of Object.entries(outputBundle)) {
    if (bundle.type !== 'chunk' || bundle.facadeModuleId == null)
      continue // only chunks

    addLinks(bundle.facadeModuleId, this.getModuleInfo.bind(this), mapper)
  }

  const tree = mergeTrees(roots)

  const data: VisualizerData = {
    version,
    tree,
    nodeParts: mapper.getNodeParts(),
    nodeMetas: mapper.getNodeMetas(),
    env: {
      rollup: this.meta.rollupVersion,
    },
    options: {
      gzip: gzipSize,
      brotli: brotliSize,
      sourcemap: !!pluginOpts.sourcemap,
    },
  }

  const stringData = replaceHashPlaceholders(data)

  const fileContent: string = await renderTemplate(template, {
    title,
    data: stringData,
  })

  if (pluginOpts.emitFile) {
    if (path.isAbsolute(filename) || filename.startsWith('.'))
      this.error(ERR_FILENAME_EMIT)

    this.emitFile({
      type: 'asset',
      fileName: filename,
      source: fileContent,
    })
  }
  else {
    await fs.mkdir(path.dirname(filename), { recursive: true })
    await fs.writeFile(filename, fileContent)

    if (open)
      await opn(filename, openOptions)
  }
}

export default visualizer
