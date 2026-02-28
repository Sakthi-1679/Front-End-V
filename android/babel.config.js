module.exports = function (api) {
  api.cache(true);
  const isProd = process.env.NODE_ENV === 'production';
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Strip all console.* calls in production builds — reduces JS bundle size
      ...(isProd ? [['transform-remove-console', { exclude: [] }]] : []),
    ],
  };
};
