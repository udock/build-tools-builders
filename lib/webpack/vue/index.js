'use strict'

const _ = require('lodash')
const chalk = require('chalk')
const webpack = require('webpack')
const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')

const babelLoaderOptions = {
  babelrc: false,
  presets: [[require.resolve('@babel/preset-env'), {modules: false}]],
  plugins: [require.resolve('@babel/plugin-transform-runtime')],
  comments: false
}

module.exports = function (opts, config) {
  function resolve (dir) {
    return path.join(opts.cwd, dir)
  }
  webpack({
    mode: 'production',
    context: opts.cwd,
    entry: {
      index: './src/main.js'
    },
    output: {
      path: resolve(opts.dist),
      filename: '[name].umd.js',
      libraryTarget: 'umd',
      library: opts.package.name
    },
    externals: function (context, request, callback) {
      config.externals = [].concat(config.externals)
      config.externals.push(/^@babel\/runtime\/.*$/)
      for (let item of config.externals) {
        if (
          (_.isString(item) && request === item) ||
          (_.isRegExp(item) && item.test(request))
        ) {
          let root = config.globals && config.globals[request]
          if (_.isUndefined(root)) {
            root = request.replace(/^.*\/([^/]+)$/, '$1')
            console.log(`No name was provided for external module '${chalk.yellow.bold(request)}' in options.globals – guessing ${chalk.yellow(root)}`)
          }
          return callback(null, {
            commonjs: request,
            commonjs2: request,
            amd: request,
            root: root && root.split('.') || 'self'
          })
        }
      }
      callback()
    },
    resolve: {
      extensions: ['.js', '.vue']
    },
    module: {
      rules: [
        {
          test: /\.(js|vue)$/,
          loader: require.resolve('eslint-loader'),
          enforce: 'pre',
          include: [resolve('src'), resolve('test')],
          options: {
            configFile: path.join(__dirname, './eslintrc.js'),
            formatter: require('eslint-friendly-formatter')
          }
        },
        {
          test: /\.js$/,
          include: [resolve('src'), resolve('test')],
          loader: require.resolve('babel-loader'),
          options: babelLoaderOptions
        },
        {
          test: /\.vue$/,
          loader: require.resolve('vue-loader'),
          include: [resolve('src')],
          options: {
            loaders: {
              js: {
                loader: require.resolve('babel-loader'),
                options: babelLoaderOptions
              }
            }
          }
        },
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 30000,
            name: 'img/[name].[hash:7].[ext]'
          }
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin()
    ]
    // devtool: '#source-map'
  }, function (err, stats) {
    if (err) throw err
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    console.log(chalk.cyan('  Build complete.\n'))
  })
}
