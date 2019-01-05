'use strict'

const chalk = require('chalk')
const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const sass = require('node-sass')
const filesize = require('filesize')
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')

const size = code => filesize(Buffer.byteLength(code))

module.exports = function (opts, config) {
  function normalize (filePath) {
    return filePath.replace(/\\/g, '/')
  }
  function resolve (dir) {
    return path.join(opts.cwd, dir)
  }

  const dist = opts.dist
  config.theme = config.theme || `@udock/${config.framework}-plugin-ui--theme-default`
  config.theme = normalize(path.resolve(require.resolve(config.theme), '..'))
  config.entry = config.entry || 'src/scss/index.scss'
  config.entry = normalize(resolve(config.entry))

  console.log(sass.info + '\n')

  sass.render({data: `@import "${config.theme}/common.scss";@import "${config.entry}";`}, function (err, ret) {
    if (err) {
      console.log(chalk.red(err))
    } else {
      console.log(`Time: ${ret.stats.duration}ms`)
      postcss([autoprefixer]).process(ret.css).then((ret) => {
        fs.outputFileSync(resolve(`${dist}/style/index.css`), ret.css)
        console.log(chalk.green.bold('  index.css\t'), size(ret.css))
        console.log(chalk.cyan('\n  Build sass complete.\n'))
      })

      if (config.assets) {
        console.log('Copy assets:')
        if (!_.isArray(config.assets)) {
          config.assets = [config.assets]
        }
        _.each(config.assets, function (item) {
          const target = `${dist}/${item}`
          item = `src/${item}`
          fs.copySync(resolve(item), resolve(target))
          console.log(chalk.green.bold(`  copy -> ${item} to ${target}`))
        })
        console.log(chalk.cyan('\n  Copy assets complete.\n'))
      }
    }
  })
}
