import { ScreenerRunnerConfig } from './screener.types';

const SCREENER_ENDPOINT = 'https://screener.io/api/v2/projects';

export async function screenerRunner(screenerConfigPath) {
  // Assemble final payload with 1) states, 2) build system variables, and 3) screener.config.js
  const screenerConfig: ScreenerRunnerConfig = require(screenerConfigPath) as any;

  // https://github.com/screener-io/screener-runner/blob/2a8291fb1b0219c96c8428ea6644678b0763a1a1/src/ci.js#L101
  let branchName = process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH || process.env.BUILD_SOURCEBRANCHNAME;
  // remove prefix if exists
  if (branchName.indexOf('refs/heads/') === 0) {
    branchName = branchName.replace('refs/heads/', '');
  }

  const payload = {
    states: screenerConfig.states,

    baseBranch: screenerConfig.baseBranch,
    projectRepo: screenerConfig.projectRepo,

    alwaysAcceptBaseBranch: screenerConfig.alwaysAcceptBaseBranch,
    diffOptions: screenerConfig.diffOptions,

    build: process.env.BUILD_BUILDID,
    branch: branchName,
    commit: process.env.BUILD_SOURCEVERSION,
    pullRequest: undefined,
  };

  if (process.env.SYSTEM_PULLREQUEST_PULLREQUESTID) {
    payload.pullRequest = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID.toString();
  }

  const response = await fetch(SCREENER_ENDPOINT, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': screenerConfig.apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to queue screener tests: status=${response.status}`);
  }

  const data = await response.json();

  console.log(
    `Screener tests queued. See job status at https://screener.io/v2/dashboard/${data.project}/${encodeURIComponent(
      data.branch,
    )}`,
  );
}
