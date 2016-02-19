var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  entry: {
    clique: ['./src/clique/index.js'],
    bigram: './src/app/bigram/index.js',
  },
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    path: 'dist',
    filename: '[name].js',
  },
  resolve: {
    alias: {
      d3: 'd3/d3.min.js'
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      jQuery: 'jquery'
    }),
    new CopyWebpackPlugin([
      {
        from: 'src/app/bigram/stub.html',
        to: 'index.html'
      }
    ]),
    new CleanWebpackPlugin(['dist/*'], {
      verbose: true,
      dry: false
    })
  ],
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
        test: require.resolve('./src/clique/index.js'),
        loader: 'expose?clique',
      },
      {
        test: /\.jade$/,
        loader: 'jade'
      },
      {
        test: /\.less$/,
        loaders: ['style', 'css', 'less']
      },
      {
        test: /\.styl$/,
        loaders: ['style', 'css', 'stylus']
      },
      {
        test: /\.woff2?$/,
        loader: 'url?limit=10000&minetype=application/font-woff'
      },
      {
        test: /\.(ttf|eot|svg)$/,
        loader: 'file'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.json$/,
        loader: 'json',
      },
    ],
  },
};
