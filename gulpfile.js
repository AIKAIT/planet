'use strict';

//cd /c/Users/Artur/documents/work_hard/auto_test
/*NODE_ENV=production gulp less  -  запускает сборку без SOURCEMAPS*/

var gulp = require('gulp');
var less = require('gulp-less');                                                //компилятор
var debug = require('gulp-debug');                                              //отображает в консоли происходящее
var sourcemaps = require('gulp-sourcemaps');                                    //строит sourcemaps
var gulpIf = require('gulp-if');                                                //позволяет задавать условия
var del = require('del');                                                       //чистит
var watch = require('gulp-watch');                                              //наблюдает
var newer = require('gulp-newer');                                              //определяет изменялся ли файл, чтобы не трогать его
var imagemin = require('gulp-imagemin');                                        //сжимает картинки
var pngquant = require('gulp-pngquant');                                        //плагин для imagemin
var prefixer = require('gulp-autoprefixer');                                    //автопрефиксер
var cached = require('gulp-cached');                                            //s01e06
var cssmin = require('gulp-clean-css');
var rename = require('gulp-rename');
var size = require('gulp-size');
var path = require('path');
var remember = require('gulp-remember');
var browserSync = require('browser-sync').create();
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var csscomb = require('gulp-csscomb');
var rigger = require('gulp-rigger');
var spritesmith = require('gulp.spritesmith');
var mediaCombine= require('gulp-group-css-media-queries');

var imgSrc = 'src/img/*.*';
var imgDst = 'build/img';

var isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

gulp.task('less', function() {
  console.log('------------------------- Компиляция LESS --------------');
  return gulp.src('src/style.less')
    .pipe(plumber({
      errorHandler: notify.onError(function(err) {
        return {
          message: "Ошибка: <%= error.message %>",
         title: "Ошибка компиляции LESS"
        };
      })
    }))
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))                             /*для удаления SOURCEMAPS на продакшене*/
    .pipe(debug({title: 'src-----------'}))
    .pipe(remember('less'))
    .pipe(less())
    .pipe(debug({title: 'less----------'}))
    .pipe(prefixer( {
          browsers: ['last 2 versions'],
          // cascade  : false
        }))
    .pipe(debug({title: 'autoprefixer--'}))
    .pipe(csscomb())
    .pipe(debug({title: 'csscomb-------'}))
    // .pipe(cssmin())                                                          // Отключено для удобочитаемости (включить при сборке)
    // .pipe(debug({title: 'cssmin--------'}))                                  // Отключено для удобочитаемости (включить при сборке)
    .pipe(rename({ prefix: 'min.'}))
    .pipe(debug({title: 'rename--------'}))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))                            /*для удаления SOURCEMAPS на продакшене*/
    .pipe(size({title: '-CSS'}))
    .pipe(gulp.dest('build'))
    .pipe(debug({title: 'build---------'}));
    // .pipe(reload({stream: true}));
});


gulp.task('html', function() {
  console.log('-------------------------- Обработка HTML ---------------');
  return gulp.src('src/*.html')
    .pipe(plumber({
      errorHandler: notify.onError(function(err) {
        return {
          message: "Ошибка: <%= error.message %>",
          title: "Ошибка компиляции HTML"
        };
      })
    }))
    .pipe(rigger())
    .pipe(debug({title: 'rigger --------'}))
    .pipe(gulp.dest('build'));
    // .pipe(reload({stream: true}));
});


gulp.task('img', function() {
  console.log('------------------------- Обработка IMG ----------------');
  //return gulp.src('src/img/*.{jpg,png}')                                        //JPG & PNG !ONLY!
    return gulp.src('./src/img/*.*')
    .pipe(plumber({
      errorHandler: notify.onError(function(err) {
        return {
          message: "Ошибка: <%= error.message %>",
         title: "Ошибка обработки IMG"
        };
      })
    }))
    .pipe(debug({title: 'src-----------'}))
    .pipe(newer(imgDst))
    .pipe(imagemin({
            progressive: true,
            optimizationLevel: 5,
            use: [pngquant()],
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true
        }))
    .pipe(debug({title: 'imagemin------'}))
    .pipe(size({title: '---IMG size of'}))
    .pipe(gulp.dest(imgDst))
    .pipe(debug({title: 'dest----------'}));
});


gulp.task('sprite', function() {                                                //Делает PNG спрайт
  console.log('-------------------------- Делаю SPRITE -----------------');
  return gulp.src('src/img/png_sprite/*.png')
    .pipe(spritesmith ({
      imgName: 'sprite__png.png',
      cssFormat: 'less',
      cssName: 'sprite.less',
      algorithm: 'top-down',
    }))
    .pipe(debug({title: 'делаю ---------'}))
    .pipe(gulp.dest('src/img'))
    .pipe(size({title: '--- the size of'}));
});


gulp.task('cmq', function() {                                                   //Комбинирует media queries
  // return gulp.src('/build/min.style.css')
  gulp.src('build/style.css')
    .pipe(debug({title: 'беру ---------'}))
    .pipe(mediaCombine())
    .pipe(debug({title: 'делаю ---------'}))
    .pipe(gulp.dest('src/css'))
    .pipe(size({title: '--- the size of'}));
});


gulp.task('del', function() {
    console.log('------------------------- Удаляю build/ ---------------');
    return del('build');
});


// gulp.task('del', function() {
//   console.log('---------- Удаляю build/');
//   return gulp.src('build', {read: false})
//     .pipe(clean())
//     .pipe(debug());
//     //.pipe(notify("Clean ready!"));
// });


gulp.task('build', ['del', 'less','html', 'img']);


gulp.task('watch', function() {
  gulp.watch('src/**/*.html', ['html'])
  gulp.watch('src/**/*.less', ['less'])
  gulp.watch('src/img/*.*', ['img']);
});


gulp.task('serve', function() {
  browserSync.init({
    server: 'BUILD',
    // tunnel: true
  });
  browserSync.watch('build/**/*.*').on('change', browserSync.reload).on('error', notify.onError({
        message: "Ошибка: <%= error.message %>",
        title: "Я не сделяль :("
    }));
});



// Тестовый вариант с синхронным удалением из /build
//
// gulp.task('watch', function () {
//     // gulp.watch('src/**/*.less', ['less']);
//     var watcher = gulp.watch(imgSrc, ['img']);

//     watcher.on('change', function (event) {
//         if (event.type === 'deleted') {
//             var filePathFromSrc = path.relative(path.resolve('src/img'), event.path);
//             var destFilePath = path.resolve(imgDst, filePathFromSrc);
//             del.sync(destFilePath);
//         }
//     });
// });

