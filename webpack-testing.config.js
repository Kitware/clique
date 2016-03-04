var webpack = require('webpack');
var config = require('./webpack.config.js');

config.entry = {
  'tests.bundle': './tests.bundle.js'
};

config.devtool = 'inline-source-map';

config.module.preLoaders = [{
  test: /\.js$/,
  include: /src/,
  exclude: /(node_modules|test)/,
  loader: 'babel-istanbul'
}];

config.plugins = [
  new webpack.ProvidePlugin({
    jQuery: 'jquery'
  })
];

config.node = {
  fs: 'empty'
};

module.exports = config;
