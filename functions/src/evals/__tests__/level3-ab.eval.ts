/**
 * Level 3 Evals — AB Testing Scaffold
 *
 * This test is a placeholder for future AB testing.
 * It validates the scaffold types compile but does not run real tests.
 */

import { ABConfig, runABComparison } from '../runners/level3.runner';
import { ALL_EVAL_CASES } from '../fixtures/datasets';

describe('Level 3 Evals — AB Testing Scaffold', () => {
  it('should have AB types defined', () => {
    const config: ABConfig = {
      name: 'test-config',
      modelOverride: 'claude-sonnet-4-6',
    };
    expect(config.name).toBe('test-config');
  });

  it('should throw not-implemented error', async () => {
    const configA: ABConfig = { name: 'A' };
    const configB: ABConfig = { name: 'B' };

    await expect(
      runABComparison(ALL_EVAL_CASES, configA, configB),
    ).rejects.toThrow('not yet implemented');
  });
});
