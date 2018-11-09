// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { uglify }  from 'rollup-plugin-uglify';

var config = {
  input: process.env.entry,
  output: {
    file: process.env.dest,
    format: 'umd',
    name:'IGNBdebug',
    strict:false
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ]
};

if (process.env.uglify) {
  config.plugins.push(uglify());
}

export default config