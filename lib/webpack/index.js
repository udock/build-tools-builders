'use strict'

process.env.NODE_ENV = 'production'

module.exports = function (opts, config) {
  return require(`./${config.framework}`)(opts, config)
}
