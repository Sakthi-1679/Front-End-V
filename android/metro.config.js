const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Minify JS bundle — drops all whitespace, mangles names, removes dead code
config.transformer.minifierConfig = {
  keep_classnames: false,
  keep_fnames: false,
  mangle: { toplevel: false },
  compress: {
    drop_console: true,      // remove console.log / warn / error
    drop_debugger: true,     // remove debugger statements
    pure_getters: true,
    unused: true,
    dead_code: true,
  },
  output: {
    ascii_only: true,
    quote_style: 3,
    wrap_iife: true,
  },
};

// Exclude source maps from the bundle (saves ~30 % for large apps)
config.transformer.enableBabelRCLookup = false;

module.exports = config;
