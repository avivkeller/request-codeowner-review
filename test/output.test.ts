import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import {
  requestReviews,
  createCodeownerComment,
  handleOutput,
} from '../src/output';

// Mock @actions/core
vi.mock('@actions/core');

describe('output.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    owner: 'testowner',
    repo: 'testrepo',
    pullNumber: 123,
  };

  describe('requestReviews', () => {
    it('should request reviews from individuals and teams', async () => {
      const mockOctokit = {
        rest: {
          pulls: {
            requestReviewers: vi.fn().mockResolvedValue({}),
          },
        },
      } as any;

      const individuals = ['user1', 'user2'];
      const teams = ['team1', 'team2'];

      await requestReviews(mockOctokit, mockContext, individuals, teams);

      expect(mockOctokit.rest.pulls.requestReviewers).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        pull_number: 123,
        reviewers: ['user1', 'user2'],
        team_reviewers: ['team1', 'team2'],
      });

      expect(core.info).toHaveBeenCalledWith(
        'Found reviewers - individuals: user1, user2, teams: team1, team2'
      );
      expect(core.info).toHaveBeenCalledWith(
        'Successfully requested reviews from 4 reviewers (2 individuals, 2 teams)'
      );
    });

    it('should handle empty reviewers list', async () => {
      const mockOctokit = {
        rest: {
          pulls: {
            requestReviewers: vi.fn().mockResolvedValue({}),
          },
        },
      } as any;

      await requestReviews(mockOctokit, mockContext, [], []);

      expect(mockOctokit.rest.pulls.requestReviewers).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        pull_number: 123,
        reviewers: [],
        team_reviewers: [],
      });

      expect(core.info).toHaveBeenCalledWith(
        'Successfully requested reviews from 0 reviewers (0 individuals, 0 teams)'
      );
    });
  });

  describe('createCodeownerComment', () => {
    it('should create comment with individuals and teams', async () => {
      const mockOctokit = {
        rest: {
          issues: {
            createComment: vi.fn().mockResolvedValue({}),
          },
        },
      } as any;

      const individuals = ['user1', 'user2'];
      const teams = ['team1', 'team2'];

      await createCodeownerComment(
        mockOctokit,
        mockContext,
        individuals,
        teams
      );

      const expectedComment = `## 👋 Codeowner Review Request

The following codeowners have been identified for the changed files:

**Individual reviewers:** @user1 @user2
**Team reviewers:** @testowner/team1 @testowner/team2

Please review the changes when you have a chance. Thank you! 🙏`;

      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        issue_number: 123,
        body: expectedComment,
      });

      expect(core.info).toHaveBeenCalledWith(
        'Successfully notified 4 codeowners via comment (2 individuals, 2 teams)'
      );
    });

    it('should create comment with only individuals', async () => {
      const mockOctokit = {
        rest: {
          issues: {
            createComment: vi.fn().mockResolvedValue({}),
          },
        },
      } as any;

      const individuals = ['user1'];
      const teams: string[] = [];

      await createCodeownerComment(
        mockOctokit,
        mockContext,
        individuals,
        teams
      );

      const expectedComment = `## 👋 Codeowner Review Request

The following codeowners have been identified for the changed files:

**Individual reviewers:** @user1

Please review the changes when you have a chance. Thank you! 🙏`;

      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        issue_number: 123,
        body: expectedComment,
      });
    });

    it('should create comment with only teams', async () => {
      const mockOctokit = {
        rest: {
          issues: {
            createComment: vi.fn().mockResolvedValue({}),
          },
        },
      } as any;

      const individuals: string[] = [];
      const teams = ['team1'];

      await createCodeownerComment(
        mockOctokit,
        mockContext,
        individuals,
        teams
      );

      const expectedComment = `## 👋 Codeowner Review Request

The following codeowners have been identified for the changed files:

**Team reviewers:** @testowner/team1

Please review the changes when you have a chance. Thank you! 🙏`;

      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        issue_number: 123,
        body: expectedComment,
      });
    });
  });

  describe('handleOutput', () => {
    const mockOctokit = {
      rest: {
        pulls: {
          requestReviewers: vi.fn().mockResolvedValue({}),
        },
        issues: {
          createComment: vi.fn().mockResolvedValue({}),
        },
      },
    } as any;

    it('should call requestReviews when mode is review', async () => {
      const individuals = ['user1'];
      const teams = ['team1'];

      await handleOutput(
        mockOctokit,
        mockContext,
        individuals,
        teams,
        'review'
      );

      expect(mockOctokit.rest.pulls.requestReviewers).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        pull_number: 123,
        reviewers: ['user1'],
        team_reviewers: ['team1'],
      });
    });

    it('should call createCodeownerComment when mode is comment', async () => {
      const individuals = ['user1'];
      const teams = ['team1'];

      await handleOutput(
        mockOctokit,
        mockContext,
        individuals,
        teams,
        'comment'
      );

      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalled();
    });

    it('should throw error for invalid output mode', async () => {
      const individuals = ['user1'];
      const teams = ['team1'];

      await expect(
        handleOutput(
          mockOctokit,
          mockContext,
          individuals,
          teams,
          'invalid' as any
        )
      ).rejects.toThrow('Invalid output mode: invalid');
    });
  });
});
