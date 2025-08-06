import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import { getActionInputs } from '../src/index';

// Mock @actions/core
vi.mock('@actions/core');

describe('getActionInputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return action inputs with default values', () => {
    // Mock core.getInput to return specific values
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

    const inputs = getActionInputs();

    expect(inputs).toEqual({
      token: 'test-token',
      failOnError: false,
      outputMode: 'review',
    });

    expect(core.getInput).toHaveBeenCalledWith('token', { required: true });
    expect(core.getBooleanInput).toHaveBeenCalledWith('fail-on-error');
    expect(core.getInput).toHaveBeenCalledWith('output-mode');
  });

  it('should handle comment output mode', () => {
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

    vi.mocked(core.getBooleanInput).mockReturnValue(true);

    const inputs = getActionInputs();

    expect(inputs).toEqual({
      token: 'test-token',
      failOnError: true,
      outputMode: 'comment',
    });
  });
});
