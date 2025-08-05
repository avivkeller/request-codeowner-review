import { loadOwners, matchFile } from 'codeowners-utils';
import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  const token = core.getInput('token', { required: true });
  const octokit = github.getOctokit(token);

  // Check if we're in a pull request context
  if (!github.context.payload.pull_request) {
    core.setFailed('This action can only be run on pull request events');
    return;
  }

  const { owner, repo } = github.context.repo;
  const pullNumber = github.context.payload.pull_request.number;

  core.info(`Processing PR #${pullNumber} in ${owner}/${repo}`);

  // Get the list of changed files in the PR
  const files = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  core.info(`Found ${files.data.length} changed files`);

  // Load CODEOWNERS file
  const owners = await loadOwners(process.cwd());
  
  if (!owners) {
    core.warning('No CODEOWNERS file found');
    return;
  }

  // Find required reviewers for all changed files
  const requiredIndividualReviewers = new Set<string>();
  const requiredTeamReviewers = new Set<string>();
  
  for (const file of files.data) {
    const { owners: fileOwners} = matchFile(file.filename, owners)!;
    core.debug(`File ${file.filename} has owners: ${fileOwners.join(', ')}`);
    
    fileOwners.forEach(owner => {
      const cleanOwner = owner.replace(/^@/, '');
      
      if (cleanOwner.includes('/')) {
        const teamName = cleanOwner.split('/')[1];
        requiredTeamReviewers.add(teamName);
      } else {
        requiredIndividualReviewers.add(cleanOwner);
      }
    });
  }

  const individualReviewersList = Array.from(requiredIndividualReviewers);
  const teamReviewersList = Array.from(requiredTeamReviewers);
  
  if (individualReviewersList.length === 0 && teamReviewersList.length === 0) {
    core.info('No reviewers found in CODEOWNERS for changed files');
    return;
  }

  core.info(`Requesting reviews from individuals: ${individualReviewersList.join(', ')}`);
  core.info(`Requesting reviews from teams: ${teamReviewersList.join(', ')}`);

  // Request reviews from the identified reviewers
  const reviewRequest: {
    owner: string;
    repo: string;
    pull_number: number;
    reviewers?: string[];
    team_reviewers?: string[];
  } = {
    owner,
    repo,
    pull_number: pullNumber,
  };

  if (individualReviewersList.length > 0) {
    reviewRequest.reviewers = individualReviewersList;
  }
  
  if (teamReviewersList.length > 0) {
    reviewRequest.team_reviewers = teamReviewersList;
  }

  await octokit.rest.pulls.requestReviewers(reviewRequest);

  const totalReviewers = individualReviewersList.length + teamReviewersList.length;
  core.info(`Successfully requested reviews from ${totalReviewers} reviewers (${individualReviewersList.length} individuals, ${teamReviewersList.length} teams)`);
}

run();