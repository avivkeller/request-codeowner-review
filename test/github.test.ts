import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import { getChangedFiles } from '../src/github';

// Mock @actions/github and @actions/core
vi.mock('@actions/github');
vi.mock('@actions/core');

describe('github.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChangedFiles', () => {
    it('should return list of changed files', async () => {
      const mockOctokit = {
        rest: {
          pulls: {
            listFiles: vi.fn().mockResolvedValue({
              data: [
                { filename: 'src/file1.ts' },
                { filename: 'src/file2.ts' },
                { filename: 'docs/readme.md' },
              ],
            }),
          },
        },
      } as any;

      const context = {
        owner: 'testowner',
        repo: 'testrepo',
        pullNumber: 123,
      };

      const result = await getChangedFiles(mockOctokit, context);

      expect(result).toEqual([
        'src/file1.ts',
        'src/file2.ts',
        'docs/readme.md',
      ]);
      expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        pull_number: 123,
      });
      expect(core.info).toHaveBeenCalledWith(
        'Processing PR #123 in testowner/testrepo'
      );
      expect(core.info).toHaveBeenCalledWith('Found 3 changed files');
    });

    it('should handle empty file list', async () => {
      const mockOctokit = {
        rest: {
          pulls: {
            listFiles: vi.fn().mockResolvedValue({
              data: [],
            }),
          },
        },
      } as any;

      const context = {
        owner: 'testowner',
        repo: 'testrepo',
        pullNumber: 123,
      };

      const result = await getChangedFiles(mockOctokit, context);

      expect(result).toEqual([]);
      expect(core.info).toHaveBeenCalledWith('Found 0 changed files');
    });
  });
});
