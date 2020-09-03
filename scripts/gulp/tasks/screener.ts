import { task, series } from 'gulp';
import fs from 'fs-extra';
import { argv } from 'yargs';

import sh from '../sh';
import config from '../../config';

const { paths } = config;

// ----------------------------------------
// Visual
// ----------------------------------------

task('screener:runner', cb => {
  // screener-runner doesn't allow to pass custom options
  if (argv.filter) process.env.SCREENER_FILTER = argv.filter as string;

  // kill the server when done
  sh(`screener-runner --conf ${paths.base('scripts/screener/screener.config.js')}`)
    .then(() => {
      cb();
      process.exit(0);
    })
    .catch(err => {
      cb(err);
      process.exit(1);
    });
});

// ----------------------------------------
// Default
// ----------------------------------------

task('screener:pages', done => {
  const screenerConfig = require('../../screener/screener.states').default;
  const sourceIndexFile = config.paths.docsDist('index.html');

  screenerConfig.forEach(state => {
    const exampleNameWithRTLSetting = state.url.split('/maximize/')[1];

    const targetDirectory = config.paths.docsDist('maximize', exampleNameWithRTLSetting);
    const targetFilename = config.paths.docsDist('maximize', exampleNameWithRTLSetting, 'index.html');

    fs.mkdirpSync(targetDirectory);
    fs.copyFileSync(sourceIndexFile, targetFilename);
  });

  done();
});

task('screener:build', series('build:docs:assets:component:info', 'build:docs', 'screener:pages'));
