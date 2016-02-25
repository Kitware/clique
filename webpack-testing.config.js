var webpack = require('webpack');
var config = require('./webpack.config.js');

config.entry = {
  'clique-exports': './test/clique-exports.js'
};

config.output.path = 'dist/test';

config.plugins = [
  new webpack.ProvidePlugin({
    jQuery: 'jquery'
  })
];

config.node = {
  fs: 'empty'
};

module.exports = config;
