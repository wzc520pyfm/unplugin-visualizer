import commonJs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import alias from '@rollup/plugin-alias'
import postcss from 'rollup-plugin-postcss'
import postcssUrl from 'postcss-url'

const HTML_TEMPLATE = ['treemap', 'sunburst', 'network', 'flamegraph']

/** @type {import('rollup').RollupOptions} */
export default HTML_TEMPLATE.map(templateType => ({
  input: `./client/${templateType}/index.tsx`,

  plugins: [
    [
      typescript({ tsconfig: './client/tsconfig.json', noEmitOnError: true }),
      alias({
        entries: [{ find: 'picomatch', replacement: 'picomatch-browser' }],
      }),
      resolve({ mainFields: ['module', 'main'] }),
      commonJs({
        ignoreGlobal: true,
        include: ['node_modules/**'],
      }),
      postcss({
        extract: true,
        plugins: [
          postcssUrl({
            url: 'inline',
          }),
        ],
      }),
    ],
  ],

  output: {
    format: 'iife',
    file: `./dist/lib/${templateType}.js`,
    name: 'drawChart',
    exports: 'named',
  },
}))
