var webpack = require('webpack');
var config = require('./webpack.config.js');

config.entry = {
  'tests.bundle': './tests.bundle.js'
};

config.devtool = 'inline-source-map';

config.plugins = [
  new webpack.ProvidePlugin({
    jQuery: 'jquery'
  })
];

config.node = {
  fs: 'empty'
};

module.exports = config;
