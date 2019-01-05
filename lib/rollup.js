'use strict'

const chalk = require('chalk')
const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const filesize = require('filesize')
const uglifyES = require('uglify-es')
const uglifyJS = require('uglify-js')

const uglifyOptions = () => {
  return {
    output: {}
  }
}

module.exports = function (opts, config) {
  function resolve (dir) {
    return path.join(opts.cwd, dir)
  }
  const packageJson = opts.package
  const banner = `/**
* ${packageJson.name} v${packageJson.version}
* Copyright © udock-framework 2019.
*/
`
  const entry = 'src/main.js'
  const defaultInputOptions = {
    input: resolve(entry),
    plugins: [babel({
      babelrc: false,
      runtimeHelpers: true,
      'presets': [
        [require.resolve('@babel/preset-env'), {modules: false}]
      ],
      plugins: [require.resolve('@babel/plugin-transform-runtime')],
      'comments': true
    })]
  }

  const inputOptions = _.extend(defaultInputOptions, _.pick(config, ['external']))
  inputOptions.external = (id) => {
    if (/^@babel\/runtime\/.*$/.test(id)) {
      return true
    } else if (_.isFunction(config.external)) {
      return config.external(id)
    }
  }

  const filename = `${opts.dist}/index`
  if (!packageJson.module || packageJson.module === entry) packageJson.module = `${filename}.esm`
  if (!packageJson.main || packageJson.main === entry) packageJson.main = `${filename}.umd`

  const targets = [
    {
      name: packageJson.module,
      options: {
        output: {
          banner: banner,
          format: 'es'
        }
      },
      uglify: uglifyES
    },
    {
      name: packageJson.main,
      options: {
        output: {
          name: packageJson.name,
          banner: banner,
          format: 'umd',
          exports: 'named',
          ..._.pick(config, ['globals'])
        }
      },
      uglify: uglifyJS
    }
  ]

  console.log(`Version: rollup ${rollup.VERSION}`)

  rollup.rollup(inputOptions).then(bundle => {
    const size = code => filesize(Buffer.byteLength(code))
    console.info('\nfiles size:')
    const tasks = []
    targets.forEach((target) => {
      const name = target.name.replace(/\.js$/i, '')
      const options = target.options
      const uglify = target.uglify

      tasks.push(
        bundle.generate(options).then((source) => {
          const code = source.output[0].code
          console.info(' ', chalk.green.bold(`${name}.js      `), size(code))
          fs.outputFileSync(resolve(`${name}.js`), code, 'utf8')
          const result = uglify.minify(code, uglifyOptions())
          result.error && console.error('  ', result.error)
          console.info(' ', chalk.green.bold(`${name}.min.js  `), size(result.code))
          fs.outputFileSync(resolve(`${name}.min.js`), result.code, 'utf8')
        }).catch((err) => {
          console.log(chalk.red('bundle.generate error: ', err))
          throw err
        })
      )
    })
    Promise.all(tasks).then(() => {
      console.log(chalk.cyan('\n  build done!\n\n'))
    }).catch(() => {
      console.log(chalk.red('\n  build falied ...\n\n'))
    })
  }).catch((err) => {
    console.log(chalk.red('\n  rollup error: ', err))
  })
}

