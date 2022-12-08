#!/usr/bin/env node
/* eslint-disable n/shebang */

'use strict';

/*
 * This script generates the template a changelog by comparing a current version
 * with the latest commit in a branch. Run this, copy what's logged into the
 * `CHANGELOG.md` and update the top section based on the changes listed in
 * "Community Contributions"
 *
 * Usage:
 *
 * dev/changelog <remote branch-name (Default: master)> <next version>
 */

const { Octokit } = require('@octokit/rest');
const semver = require('semver');
const gitRepoInfo = require('git-repo-info');

let currentVersion = `v${require('../package').version}`;
let branch = process.argv[2] || gitRepoInfo().branch;
let nextVersion = process.argv[3];
if (nextVersion === undefined) {
  if (branch === 'master') {
    // this is likely the "first beta" of a new cycle
    let nextMinor = semver.inc(currentVersion, 'minor');
    nextVersion = `${nextMinor}-beta.1`;
  } else if (branch === 'beta') {
    nextVersion = semver.inc(currentVersion, 'prerelease', 'beta');
  } else if (branch === 'release') {
    nextVersion = semver.inc(currentVersion, 'patch');
  } else {
    console.error('Cannot detect branch, please specify on the command line');
    process.exitCode = 1;
    return;
  }
}
if (nextVersion[0] !== 'v') {
  nextVersion = `v${nextVersion}`;
}

function generateChangelog(contributions) {
  return `
## ${nextVersion}

#### Blueprint Changes

- [\`ember new\` diff](https://github.com/ember-cli/ember-new-output/compare/${currentVersion}...${nextVersion})
- [\`ember addon\` diff](https://github.com/ember-cli/ember-addon-output/compare/${currentVersion}...${nextVersion})

#### Changelog

${contributions}

Thank you to all who took the time to contribute!
`;
}

// only filters when dependabot itself merges a PR
function excludeDependabot(commitInfo) {
  let author;

  if (commitInfo.author) {
    author = commitInfo.author.login;
  } else if (commitInfo.committer) {
    author = commitInfo.committer.login;
  } else {
    return true;
  }

  return author !== 'dependabot-preview[bot]' && author !== 'dependabot[bot]';
}

function isPullRequestMergeOrCherryPick(commitInfo) {
  let isMergeCommit = commitInfo.parents.length > 1;

  let message = commitInfo.commit.message;

  let isReleaseMergeUpwardsCommit = isMergeCommit && message.includes("Merge remote-tracking branch 'origin/release'");
  let isBetaMergeUpwardsCommit = isMergeCommit && message.includes("Merge remote-tracking branch 'origin/beta'");

  let isCherryPick = message.includes('cherry picked from');

  return !isReleaseMergeUpwardsCommit && !isBetaMergeUpwardsCommit && (isCherryPick || isMergeCommit);
}

function comparePrNumber(a, b) {
  if (a.number < b.number) {
    return -1;
  }
  if (a.number > b.number) {
    return 1;
  }
  return 0;
}

function processPages(res) {
  return res.data.commits
    .filter(excludeDependabot)
    .filter(isPullRequestMergeOrCherryPick)
    .map((commitInfo) => {
      let message = commitInfo.commit.message;

      let mergeFromBranchRegex = /#(\d+) from (.*)\//;
      let mergeWithPrReferenceRegex = /\(#(\d+)\)$/m;

      let result = {
        commitInfo,
        author: undefined,
        number: undefined,
        title: undefined,
      };

      if (mergeFromBranchRegex.test(message)) {
        let match = message.match(mergeFromBranchRegex);
        let numAndAuthor = match.slice(1, 3);

        result.number = numAndAuthor[0];
      } else if (mergeWithPrReferenceRegex.test(message)) {
        let match = message.match(mergeWithPrReferenceRegex);
        result.number = match[1];
        result.title = message.split('\n')[0];
      }

      return result;
    })
    .sort(comparePrNumber);
}

async function main() {
  let github = new Octokit({ version: '3.0.0', auth: process.env.GITHUB_AUTH });

  let res = await github.repos.compareCommits({
    owner: 'ember-cli',
    repo: 'ember-cli',
    base: currentVersion,
    head: branch,
  });

  let contributions = processPages(res);

  for (let entry of contributions) {
    if (entry.number) {
      let prInfo = await github.pulls.get({
        owner: 'ember-cli',
        repo: 'ember-cli',
        // eslint-disable-next-line camelcase
        pull_number: entry.number,
      });

      entry.title = prInfo.data.title;
      entry.author = prInfo.data.user.login;
    } else {
      // didn't find a PR
      entry.title = entry.commitInfo.commit.message.split('\n\n')[0];
      entry.author = entry.commitInfo.author?.login;
    }
  }

  let changelogEntries = contributions
    // For example `Merge branch 'master' into user/branch`
    .filter((entry) => entry.author)
    // filters PR's _from_ dependabot that were merged manually
    .filter((entry) => entry.author !== 'dependabot-preview[bot]' && entry.author !== 'dependabot[bot]')
    .map((pr) => {
      let link;
      if (pr.number) {
        link = `[#${pr.number}](https://github.com/ember-cli/ember-cli/pull/${pr.number})`;
      } else {
        link = `[${pr.commitInfo.sha}](${pr.commitInfo.html_url})`;
      }
      let title = pr.title;
      let author = `[@${pr.author}]` + `(https://github.com/${pr.author})`;

      return `- ${link} ${title} ${author}`;
    })
    .join('\n');

  let changelog = generateChangelog(changelogEntries);

  console.log(changelog);
}

main().catch((err) => {
  console.error(err);
});
