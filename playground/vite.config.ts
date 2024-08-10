import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Unplugin from '../dist/vite'

export default defineConfig({
  plugins: [
    Inspect(),
    Unplugin(),
    // visualizer({
    //   // template: 'flamegraph',
    //   // template: 'list',
    //   template: 'sunburst',
    //   // template: 'treemap',
    //   // template: 'network',
    //   // template: 'raw-data',
    // }),
  ],
})
