const fs = require('fs')
const gulp = require('gulp')
const XEUtils = require('xe-utils')
const del = require('del')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const replace = require('gulp-replace')
const clean = require('gulp-clean')
const sass = require('gulp-sass')
const cleanCSS = require('gulp-clean-css')
const prefixer = require('gulp-autoprefixer')
const merge = require('merge-stream')
const pack = require('./package.json')

const components = [
  'v-x-e-table',
  'vxe-table',

  'icon',
  'filter',
  'menu',
  'edit',
  'export',
  'keyboard',
  'validator',
  'header',
  'footer',

  'column',
  'colgroup',
  'toolbar',
  'grid',
  'pager',
  'checkbox',
  'checkbox-group',
  'radio',
  'radio-group',
  'radio-button',
  'input',
  'textarea',
  'button',
  'modal',
  'tooltip',
  'form',
  'form-item',
  'form-gather',
  'select',
  'optgroup',
  'option',
  'switch',
  'list',
  'pulldown',

  'table'
]

const languages = [
  'zh-CN',
  'zh-TC',
  'zh-HK',
  'zh-MO',
  'zh-TW',
  'en-US',
  'ja-JP'
]

const styleCode = `require('./style.css')`

gulp.task('build_modules', () => {
  return gulp.src('packages/**/*.js')
    .pipe(replace('process.env.VUE_APP_VXE_TABLE_VERSION', `"${pack.version}"`))
    .pipe(replace('process.env.VUE_APP_VXE_TABLE_ENV', 'process.env.NODE_ENV'))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulp.dest('lib'))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min',
      extname: '.js'
    }))
    .pipe(gulp.dest('lib'))
})

gulp.task('build_i18n', () => {
  const rest = languages.map(code => {
    const name = XEUtils.camelCase(code).replace(/^[a-z]/, firstChat => firstChat.toUpperCase())
    const isZHTC = ['zh-HK', 'zh-MO', 'zh-TW'].includes(code)
    return gulp.src(`packages/locale/lang/${isZHTC ? 'zh-TC' : code}.js`)
      .pipe(babel({
        moduleId: `vxe-table-lang.${code}`,
        presets: ['@babel/env'],
        plugins: [
          ['@babel/transform-modules-umd', {
            globals: {
              [`vxe-table-language.${code}`]: `VXETableLang${name}`
            },
            exactGlobals: true
          }]
        ]
      }))
      .pipe(rename({
        basename: code,
        suffix: '.umd',
        extname: '.js'
      }))
      .pipe(gulp.dest('lib/locale/lang'))
      .pipe(uglify())
      .pipe(rename({
        basename: code,
        suffix: '.min',
        extname: '.js'
      }))
      .pipe(gulp.dest('lib/locale/lang'))
  })
  return merge(...rest)
})

gulp.task('copy_ts', () => {
  return gulp.src('packages/**/*.d.ts')
    .pipe(gulp.dest('lib'))
})

gulp.task('build_lib', () => {
  return merge(
    gulp.src('lib_temp/index.umd.js')
      .pipe(gulp.dest('lib')),
    gulp.src('lib_temp/index.umd.min.js')
      .pipe(gulp.dest('lib')),
    gulp.src('lib_temp/index.css')
      .pipe(gulp.dest('lib'))
      .pipe(rename({
        basename: 'style',
        extname: '.css'
      }))
      .pipe(gulp.dest('lib'))
      .pipe(rename({
        basename: 'style',
        suffix: '.min',
        extname: '.css'
      }))
      .pipe(gulp.dest('lib'))
  )
})

gulp.task('build_style', gulp.series('build_modules', 'build_i18n', 'copy_ts', () => {
  const rest = components.map(name => {
   return gulp.src(`styles/${name}.scss`)
     .pipe(replace(/(\/\*\*Variable\*\*\/)/, `@import './variable.scss';\n`))
     .pipe(sass())
     .pipe(prefixer({
       borwsers: ['last 1 version', '> 1%', 'not ie <= 8'],
       cascade: true,
       remove: true
     }))
     .pipe(rename({
        basename: 'style',
        extname: '.css'
      }))
      .pipe(gulp.dest(`lib/${name}/style`))
      .pipe(cleanCSS())
      .pipe(rename({
        basename: 'style',
        suffix: '.min',
        extname: '.css'
      }))
      .pipe(gulp.dest(`lib/${name}/style`))
 })
 return merge(...rest)
}))

gulp.task('build_clean', () => {
  return del('lib')
})

gulp.task('build', gulp.series('build_clean', 'build_style', 'build_lib', () => {
  components.forEach(name => {
    fs.writeFileSync(`lib/${name}/style/index.js`, styleCode)
  })
  return del([
    'lib_temp'
  ])
}))
