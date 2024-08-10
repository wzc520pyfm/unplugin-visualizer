import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { NormalizedOutputOptions, OutputBundle, OutputOptions } from 'rollup'
import type { Options } from './types'
import { visualizer } from './core/index'

export const unpluginFactory: UnpluginFactory<Options | ((outputOptions: OutputOptions) => Options) | undefined> = (options = {}) => {
  return {
    name: 'unplugin-visualizer2',
    rollup: {
      generateBundle(
        outputOptions: NormalizedOutputOptions,
        outputBundle: OutputBundle,
      ) {
        visualizer.call(this, options, outputOptions, outputBundle)
      },
    },
    vite: {
      generateBundle(
        outputOptions: NormalizedOutputOptions,
        outputBundle: OutputBundle,
      ) {
        visualizer.call(this, options, outputOptions, outputBundle)
      },
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
