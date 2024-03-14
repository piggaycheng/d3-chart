import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: './src/index.ts',
  output: {
    file: './build/Release/d3Chart.mjs',
    format: 'es',
  },
  plugins: [
    typescript(),
    resolve()
  ]
};