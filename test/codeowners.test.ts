import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import { loadCodeowners, findRequiredReviewers } from '../src/codeowners';
import { loadOwners, matchFile } from 'codeowners-utils';

// Mock dependencies
vi.mock('@actions/core');
vi.mock('codeowners-utils');

describe('codeowners.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadCodeowners', () => {
    it('should return owners when CODEOWNERS file exists', async () => {
      const mockOwners = []; // CodeOwnersEntry array
      vi.mocked(loadOwners).mockResolvedValue(mockOwners);

      const result = await loadCodeowners('/test/path');

      expect(result).toBe(mockOwners);
      expect(loadOwners).toHaveBeenCalledWith('/test/path');
    });

    it('should return null and warn when no CODEOWNERS file found', async () => {
      vi.mocked(loadOwners).mockResolvedValue(null);

      const result = await loadCodeowners('/test/path');

      expect(result).toBeNull();
      expect(core.warning).toHaveBeenCalledWith('No CODEOWNERS file found');
    });

    it('should use process.cwd() as default path', async () => {
      const mockOwners = [];
      vi.mocked(loadOwners).mockResolvedValue(mockOwners);

      await loadCodeowners();

      expect(loadOwners).toHaveBeenCalledWith(process.cwd());
    });
  });

  describe('findRequiredReviewers', () => {
    const mockOwners = [];

    it('should return empty arrays when no files have owners', () => {
      const files = ['src/file1.ts', 'src/file2.ts'];

      vi.mocked(matchFile).mockReturnValue(null);

      const result = findRequiredReviewers(files, mockOwners);

      expect(result).toEqual({
        individuals: [],
        teams: [],
      });
      expect(core.debug).toHaveBeenCalledWith(
        'No owners found for file: src/file1.ts'
      );
      expect(core.debug).toHaveBeenCalledWith(
        'No owners found for file: src/file2.ts'
      );
    });

    it('should separate individual and team reviewers correctly', () => {
      const files = ['src/file1.ts', 'src/file2.ts'];

      vi.mocked(matchFile)
        .mockReturnValueOnce({
          pattern: 'src/*',
          owners: ['@user1', '@org/team1'],
        })
        .mockReturnValueOnce({
          pattern: 'src/*',
          owners: ['@user2', '@org/team2'],
        });

      const result = findRequiredReviewers(files, mockOwners);

      expect(result).toEqual({
        individuals: ['user1', 'user2'],
        teams: ['team1', 'team2'],
      });
      expect(core.debug).toHaveBeenCalledWith(
        'File src/file1.ts has owners: @user1, @org/team1'
      );
      expect(core.debug).toHaveBeenCalledWith(
        'File src/file2.ts has owners: @user2, @org/team2'
      );
    });

    it('should deduplicate reviewers across files', () => {
      const files = ['src/file1.ts', 'src/file2.ts'];

      vi.mocked(matchFile)
        .mockReturnValueOnce({
          pattern: 'src/*',
          owners: ['@user1', '@org/team1'],
        })
        .mockReturnValueOnce({
          pattern: 'src/*',
          owners: ['@user1', '@org/team1'], // Same reviewers
        });

      const result = findRequiredReviewers(files, mockOwners);

      expect(result).toEqual({
        individuals: ['user1'],
        teams: ['team1'],
      });
    });

    it('should handle owners without @ prefix', () => {
      const files = ['src/file1.ts'];

      vi.mocked(matchFile).mockReturnValue({
        pattern: 'src/*',
        owners: ['user1', 'org/team1'], // No @ prefix
      });

      const result = findRequiredReviewers(files, mockOwners);

      expect(result).toEqual({
        individuals: ['user1'],
        teams: ['team1'],
      });
    });

    it.only('should handle files with no owners in match result', () => {
      const files = ['src/file1.ts'];

      vi.mocked(matchFile).mockReturnValue({
        pattern: 'src/*',
        owners: [],
      });

      const result = findRequiredReviewers(files, mockOwners);

      expect(result).toEqual({
        individuals: [],
        teams: [],
      });
      expect(core.debug).toHaveBeenCalledWith(
        'No owners found for file: src/file1.ts'
      );
    });

    it('should handle mixed owner formats', () => {
      const files = ['src/file1.ts'];

      vi.mocked(matchFile).mockReturnValue({
        pattern: 'src/*',
        owners: ['@individual1', 'individual2', '@org/team1', 'org/team2'],
      });

      const result = findRequiredReviewers(files, mockOwners);

      expect(result).toEqual({
        individuals: ['individual1', 'individual2'],
        teams: ['team1', 'team2'],
      });
    });
  });
});
