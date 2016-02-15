var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    clique: './src/clique.js',
  },
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    path: 'dist',
    filename: '[name].js',
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loader: 'semistandard',
        include: path.resolve(__dirname, 'src'),
      },
    ],
    loaders: [
      {
        test: require.resolve('./src/clique.js'),
        loader: 'expose?clique',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
        include: path.resolve(__dirname, 'src'),
      },
    ],
  },
};
