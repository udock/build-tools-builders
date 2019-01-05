'use strict'

const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const projectDir = path.resolve('.')

// process.chdir(path.resolve(__dirname))

module.exports = function (tasks) {
  const options = {
    cwd: projectDir,
    dist: 'dist',
    package: _.cloneDeep(require(path.join(projectDir, 'package.json')))
  }
  fs.removeSync(path.join(projectDir, options.dist))

  if (!_.isArray(tasks)) {
    tasks = [tasks]
  }
  _.each(tasks, function (task) {
    const config = require(path.join(projectDir, `build/${task}.config.js`))
    config.framework = options.package.name.split('-')[0].replace(/^.*\//, '')
    switch (task) {
      case 'rollup':
        require('./lib/rollup')(options, config)
        break
      case 'webpack':
        require('./lib/webpack')(options, config)
        break
      case 'sass':
        require('./lib/sass')(options, config)
        break
      default:
    }
  })
}
