module.exports = {
  basePath: '..',
  singleRun: true,
  browsers: [
    'PhantomJS'
  ],
  frameworks: [
    'tap'
  ],
  files: [
    'tests.bundle.js'
  ],
  plugins: [
    'karma-phantomjs-launcher',
    'karma-sourcemap-loader',
    'karma-webpack',
    'karma-coverage',
    'karma-tap',
    'karma-tape-reporter'
  ],
  preprocessors: {
    'tests.bundle.js': [
      'webpack',
      'sourcemap'
    ]
  },
  webpackServer: {
    noInfo: true
  }
}
