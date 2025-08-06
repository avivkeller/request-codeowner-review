import * as github from '@actions/github';
import * as core from '@actions/core';
import { GitHubContext } from './types';

/**
 * Validates that we're running in a pull request context
 */
export function validatePullRequestContext(): GitHubContext {
  if (!github.context.payload.pull_request) {
    throw new Error('This action can only be run on pull request events');
  }

  const { owner, repo } = github.context.repo;
  const pullNumber = github.context.payload.pull_request.number;

  return { owner, repo, pullNumber };
}

/**
 * Gets the list of changed files in a pull request
 */
export async function getChangedFiles(
  octokit: ReturnType<typeof github.getOctokit>,
  context: GitHubContext
): Promise<string[]> {
  core.info(
    `Processing PR #${context.pullNumber} in ${context.owner}/${context.repo}`
  );

  const files = await octokit.rest.pulls.listFiles({
    owner: context.owner,
    repo: context.repo,
    pull_number: context.pullNumber,
  });

  core.info(`Found ${files.data.length} changed files`);

  return files.data.map((file) => file.filename);
}
