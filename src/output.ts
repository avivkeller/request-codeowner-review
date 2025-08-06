import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHubContext } from './types';

/**
 * Requests reviews from codeowners using GitHub's review request feature
 */
export async function requestReviews(
  octokit: ReturnType<typeof github.getOctokit>,
  context: GitHubContext,
  individuals: string[],
  teams: string[]
): Promise<void> {
  core.info(
    `Found reviewers - individuals: ${individuals.join(', ')}, teams: ${teams.join(', ')}`
  );

  await octokit.rest.pulls.requestReviewers({
    owner: context.owner,
    repo: context.repo,
    pull_number: context.pullNumber,
    reviewers: individuals,
    team_reviewers: teams,
  });

  const totalReviewers = individuals.length + teams.length;
  core.info(
    `Successfully requested reviews from ${totalReviewers} reviewers (${individuals.length} individuals, ${teams.length} teams)`
  );
}

/**
 * Creates a comment on the pull request notifying codeowners
 */
export async function createCodeownerComment(
  octokit: ReturnType<typeof github.getOctokit>,
  context: GitHubContext,
  individuals: string[],
  teams: string[]
): Promise<void> {
  core.info(
    `Found reviewers - individuals: ${individuals.join(', ')}, teams: ${teams.join(', ')}`
  );

  const individualMentions = individuals.map((user) => `@${user}`).join(' ');
  const teamMentions = teams.map((team) => `@${context.owner}/${team}`).join(' ');

  let comment = '## 👋 Codeowner Review Request\n\n';
  comment +=
    'The following codeowners have been identified for the changed files:\n\n';

  if (individuals.length > 0) {
    comment += `**Individual reviewers:** ${individualMentions}\n`;
  }
  if (teams.length > 0) {
    comment += `**Team reviewers:** ${teamMentions}\n`;
  }

  comment +=
    '\nPlease review the changes when you have a chance. Thank you! 🙏';

  await octokit.rest.issues.createComment({
    owner: context.owner,
    repo: context.repo,
    issue_number: context.pullNumber,
    body: comment,
  });

  const totalReviewers = individuals.length + teams.length;
  core.info(
    `Successfully notified ${totalReviewers} codeowners via comment (${individuals.length} individuals, ${teams.length} teams)`
  );
}

/**
 * Handles output based on the specified mode
 */
export async function handleOutput(
  octokit: ReturnType<typeof github.getOctokit>,
  context: GitHubContext,
  individuals: string[],
  teams: string[],
  outputMode: 'review' | 'comment'
): Promise<void> {
  if (outputMode === 'review') {
    await requestReviews(octokit, context, individuals, teams);
  } else if (outputMode === 'comment') {
    await createCodeownerComment(octokit, context, individuals, teams);
  } else {
    throw new Error(`Invalid output mode: ${outputMode}`);
  }
}
