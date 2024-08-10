import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import visualizer from 'unplugin-visualizer2/vite'

export default defineConfig({
  plugins: [
    Inspect(),
    visualizer({
      // template: 'flamegraph',
      // template: 'list',
      template: 'sunburst',
      // template: 'treemap',
      // template: 'network',
      // template: 'raw-data',
    }),
  ],
})
