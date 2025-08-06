import * as core from '@actions/core';
import * as github from '@actions/github';
import { ActionInputs } from './types';
import { loadCodeowners, findRequiredReviewers } from './codeowners';
import { validatePullRequestContext, getChangedFiles } from './github';
import { handleOutput } from './output';

/**
 * Gets and validates action inputs
 */
export function getActionInputs(): ActionInputs {
  const token = core.getInput('token', { required: true });
  const failOnError = core.getBooleanInput('fail-on-error');
  const outputMode = core.getInput('output-mode') as 'review' | 'comment';

  return { token, failOnError, outputMode };
}

/**
 * Main orchestrator function that coordinates the entire flow
 */
export default async function processCodeownerReviewRequest(): Promise<void> {
  // Get inputs (outside try block so we can access failOnError in catch)
  const inputs = getActionInputs();

  try {
    const octokit = github.getOctokit(inputs.token);

    // Validate context
    const context = validatePullRequestContext();

    // Get changed files
    const files = await getChangedFiles(octokit, context);

    // Load CODEOWNERS
    const owners = await loadCodeowners();
    if (!owners) {
      return;
    }

    // Find required reviewers
    const { individuals, teams } = findRequiredReviewers(files, owners);

    if (individuals.length === 0 && teams.length === 0) {
      core.info('No reviewers found in CODEOWNERS for changed files');
      return;
    }

    core.info(
      `Found reviewers - individuals: ${individuals.join(', ')}, teams: ${teams.join(', ')}`
    );

    // Handle output based on mode
    await handleOutput(octokit, context, individuals, teams, inputs.outputMode);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';

    if (inputs.failOnError) {
      core.setFailed(errorMessage);
    } else {
      core.warning(`Action completed with errors: ${errorMessage}`);
    }
  }
}
