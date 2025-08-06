import { loadOwners, matchFile } from 'codeowners-utils';
import * as core from '@actions/core';

/**
 * Loads the CODEOWNERS file from the current working directory
 */
export async function loadCodeowners(cwd: string = process.cwd()) {
  const owners = await loadOwners(cwd);

  if (!owners) {
    core.warning('No CODEOWNERS file found');
    return null;
  }

  return owners;
}

/**
 * Finds required reviewers for a list of changed files based on CODEOWNERS
 */
export function findRequiredReviewers(
  files: string[],
  owners: any
): {
  individuals: string[];
  teams: string[];
} {
  const individualReviewers = new Set<string>();
  const teamReviewers = new Set<string>();

  for (const file of files) {
    const match = matchFile(file, owners);

    if (!match || !match.owners || match.owners.length < 1) {
      core.debug(`No owners found for file: ${file}`);
      continue;
    }

    const { owners: fileOwners } = match;
    core.debug(`File ${file} has owners: ${fileOwners.join(', ')}`);

    fileOwners.forEach((owner) => {
      const cleanOwner = owner.replace(/^@/, '');

      if (cleanOwner.includes('/')) {
        const teamName = cleanOwner.split('/')[1];
        teamReviewers.add(teamName);
      } else {
        individualReviewers.add(cleanOwner);
      }
    });
  }

  return {
    individuals: Array.from(individualReviewers),
    teams: Array.from(teamReviewers),
  };
}
