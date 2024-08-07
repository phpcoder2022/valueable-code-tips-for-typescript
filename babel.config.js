const test = process.env.NODE_ENV === 'test';

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      ...(test ? [{ targets: { node: 'current' } }] : []),
    ],
  ],
  exclude: test ? /node_modules|\.ts$/ : /node_modules/,
};
