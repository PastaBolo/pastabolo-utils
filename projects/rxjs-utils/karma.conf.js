// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-jasmine-given'),
      require('karma-mocha-reporter'),
      require('karma-jasmine-diff-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    // TRIGGER
    autoWatch: true,
    singleRun: false,
    restartOnFileChange: true,

    // BUILD
    basePath: '',
    frameworks: ['jasmine-given', 'jasmine', '@angular-devkit/build-angular'],

    // RUN
    port: 9876,
    browsers: ['Chrome'],

    // REPORT
    colors: true,
    logLevel: config.LOG_INFO,

    reporters: ['jasmine-diff', 'mocha'],

    jasmineDiffReporter: {
      color: {
        expectedBg: 'bgMagenta',
        expectedWhitespaceBg: 'bgMagenta',
        actualBg: 'bgBlue',
        actualWhitespaceBg: 'bgBlue'
      }
    },

    mochaReporter: {
      output: 'minimal'
    },

    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },

    coverageReporter: {
      dir: require('path').join(__dirname, '../../coverage/rxjs'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    }

  });
};
