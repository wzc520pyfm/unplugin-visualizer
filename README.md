# unplugin-visualizer2

[![NPM version](https://img.shields.io/npm/v/unplugin-visualizer2?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-visualizer2)

Visualize and analyze your bundle to see which modules are taking up space. Works with any bundler, powered by unplugin.

## Install

```bash
npm i --save-dev unplugin-visualizer2
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import UnpluginVisualizer2 from 'unplugin-visualizer2/vite'

export default defineConfig({
  plugins: [
    UnpluginVisualizer2({
      /* options */
    }),
  ],
})
```

Example: [`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import UnpluginVisualizer2 from 'unplugin-visualizer2/rollup'

export default {
  plugins: [
    UnpluginVisualizer2({
      /* options */
    }),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-visualizer2/webpack')({
      /* options */
    }),
  ],
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    [
      'unplugin-visualizer2/nuxt',
      {
        /* options */
      },
    ],
  ],
})
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-visualizer2/webpack')({
        /* options */
      }),
    ],
  },
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import UnpluginVisualizer2 from 'unplugin-visualizer2/esbuild'

build({
  plugins: [UnpluginVisualizer2()],
})
```

<br></details>

## Usage

### Options

For all options please refer to [docs](https://github.com/btd/rollup-plugin-visualizer?tab=readme-ov-file#how-to-use-generated-files).

This plugin accepts all [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer?tab=readme-ov-file#options) options.
