import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import * as github from '@actions/github';
import processCodeownerReviewRequest from '../src/index';
import { loadCodeowners, findRequiredReviewers } from '../src/codeowners';
import { validatePullRequestContext, getChangedFiles } from '../src/github';
import { handleOutput } from '../src/output';

// Mock all dependencies
vi.mock('@actions/core');
vi.mock('@actions/github');
vi.mock('../src/codeowners');
vi.mock('../src/github');
vi.mock('../src/output');

describe('processCodeownerReviewRequest (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'token':
          return 'test-token';
        case 'output-mode':
          return 'review';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);
  });

  it('should complete successful flow with reviewers found', async () => {
    // Setup mocks
    const mockOctokit = { rest: {} };
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any);

    const mockContext = { owner: 'test', repo: 'repo', pullNumber: 123 };
    vi.mocked(validatePullRequestContext).mockReturnValue(mockContext);

    const mockFiles = ['src/file1.ts', 'src/file2.ts'];
    vi.mocked(getChangedFiles).mockResolvedValue(mockFiles);

    const mockOwners = [];
    vi.mocked(loadCodeowners).mockResolvedValue(mockOwners);

    const mockReviewers = { individuals: ['user1'], teams: ['team1'] };
    vi.mocked(findRequiredReviewers).mockReturnValue(mockReviewers);

    vi.mocked(handleOutput).mockResolvedValue();

    await processCodeownerReviewRequest();

    expect(github.getOctokit).toHaveBeenCalledWith('test-token');
    expect(validatePullRequestContext).toHaveBeenCalled();
    expect(getChangedFiles).toHaveBeenCalledWith(mockOctokit, mockContext);
    expect(loadCodeowners).toHaveBeenCalled();
    expect(findRequiredReviewers).toHaveBeenCalledWith(mockFiles, mockOwners);
    expect(handleOutput).toHaveBeenCalledWith(
      mockOctokit,
      mockContext,
      ['user1'],
      ['team1'],
      'review'
    );
    expect(core.info).toHaveBeenCalledWith(
      'Found reviewers - individuals: user1, teams: team1'
    );
  });

  it('should exit early when no CODEOWNERS file found', async () => {
    const mockOctokit = { rest: {} };
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any);

    const mockContext = { owner: 'test', repo: 'repo', pullNumber: 123 };
    vi.mocked(validatePullRequestContext).mockReturnValue(mockContext);

    const mockFiles = ['src/file1.ts'];
    vi.mocked(getChangedFiles).mockResolvedValue(mockFiles);

    vi.mocked(loadCodeowners).mockResolvedValue(null);

    await processCodeownerReviewRequest();

    expect(loadCodeowners).toHaveBeenCalled();
    expect(findRequiredReviewers).not.toHaveBeenCalled();
    expect(handleOutput).not.toHaveBeenCalled();
  });

  it('should exit early when no reviewers found', async () => {
    const mockOctokit = { rest: {} };
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any);

    const mockContext = { owner: 'test', repo: 'repo', pullNumber: 123 };
    vi.mocked(validatePullRequestContext).mockReturnValue(mockContext);

    const mockFiles = ['src/file1.ts'];
    vi.mocked(getChangedFiles).mockResolvedValue(mockFiles);

    const mockOwners = [];
    vi.mocked(loadCodeowners).mockResolvedValue(mockOwners);

    const mockReviewers = { individuals: [], teams: [] };
    vi.mocked(findRequiredReviewers).mockReturnValue(mockReviewers);

    await processCodeownerReviewRequest();

    expect(findRequiredReviewers).toHaveBeenCalledWith(mockFiles, mockOwners);
    expect(core.info).toHaveBeenCalledWith(
      'No reviewers found in CODEOWNERS for changed files'
    );
    expect(handleOutput).not.toHaveBeenCalled();
  });

  it('should handle errors with fail-on-error=true', async () => {
    vi.mocked(core.getBooleanInput).mockReturnValue(true);

    const error = new Error('Test error');
    vi.mocked(github.getOctokit).mockImplementation(() => {
      throw error;
    });

    await processCodeownerReviewRequest();

    expect(core.setFailed).toHaveBeenCalledWith('Test error');
    expect(core.warning).not.toHaveBeenCalled();
  });

  it('should handle errors with fail-on-error=false', async () => {
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const error = new Error('Test error');
    vi.mocked(github.getOctokit).mockImplementation(() => {
      throw error;
    });

    await processCodeownerReviewRequest();

    expect(core.warning).toHaveBeenCalledWith(
      'Action completed with errors: Test error'
    );
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should handle unknown errors', async () => {
    vi.mocked(core.getBooleanInput).mockReturnValue(true);

    vi.mocked(github.getOctokit).mockImplementation(() => {
      throw 'String error'; // Non-Error object
    });

    await processCodeownerReviewRequest();

    expect(core.setFailed).toHaveBeenCalledWith('An unknown error occurred');
  });

  it('should work with comment output mode', async () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'token':
          return 'test-token';
        case 'output-mode':
          return 'comment';
        default:
          return '';
      }
    });

    const mockOctokit = { rest: {} };
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any);

    const mockContext = { owner: 'test', repo: 'repo', pullNumber: 123 };
    vi.mocked(validatePullRequestContext).mockReturnValue(mockContext);

    const mockFiles = ['src/file1.ts'];
    vi.mocked(getChangedFiles).mockResolvedValue(mockFiles);

    const mockOwners = [];
    vi.mocked(loadCodeowners).mockResolvedValue(mockOwners);

    const mockReviewers = { individuals: ['user1'], teams: [] };
    vi.mocked(findRequiredReviewers).mockReturnValue(mockReviewers);

    vi.mocked(handleOutput).mockResolvedValue();

    await processCodeownerReviewRequest();

    expect(handleOutput).toHaveBeenCalledWith(
      mockOctokit,
      mockContext,
      ['user1'],
      [],
      'comment'
    );
  });
});
