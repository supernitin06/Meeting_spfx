'use strict';

const build = require('@microsoft/sp-build-web');
const gulp = require('gulp');
const { execSync } = require('child_process');

/* =========================
   Disable linting (optional)
========================= */
build.tslintCmd && (build.tslintCmd.enabled = false);
build.lintCmd && (build.lintCmd.enabled = false);

/* =========================
   Webpack Fix (lucide-react)
========================= */
build.configureWebpack.mergeConfig({
  additionalConfiguration: (config) => {

    config.resolve = config.resolve || {}; 
    config.resolve.alias = config.resolve.alias || {};

    config.resolve.alias['lucide-react$'] =
      require.resolve('lucide-react/dist/cjs/lucide-react');

    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    config.module.rules.push({
      test: /node_modules[\\/]lucide-react[\\/].*\.js$/,
      use: {
        loader: require.resolve('babel-loader'),
        options: {
          presets: [require.resolve('@babel/preset-env')]
        }
      }
    });

    return config;
  }
});

/* =========================
   Tailwind Build Task
// ========================= */
const tailwindBuildTask = build.subTask(
  'tailwind-build',
  function (gulp, buildOptions, done) {
    try {
      console.log('🔥 Building Tailwind CSS...');

      execSync(
        'npx tailwindcss -i ./src/styles/tailwind.css -o ./src/styles/tailwind.generated.css',
        { stdio: 'inherit' }
      );

      console.log('✅ Tailwind build complete');
      done();
    } catch (error) {
      console.error('❌ Tailwind build failed');
      done(error);
    }
  }
);

/* Run Tailwind BEFORE SPFx build */
build.rig.addPreBuildTask(tailwindBuildTask);

/* =========================
   Suppress SPFx warnings
========================= */
build.addSuppression(
  `Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`
);

/* =========================
   Fix serve issue (SPFx older bug)
========================= */
const getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  const result = getTasks.call(build.rig);
  result.set('serve', result.get('serve-deprecated'));
  return result;
};

/* =========================
   Initialize build
========================= */
build.initialize(gulp);