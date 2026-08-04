import { describe, expect, it } from 'vitest';

import { MetricValuePipe } from './metric-value.pipe';

describe('MetricValuePipe', () => {
  const pipe = new MetricValuePipe();

  it('renders a dash for missing readings rather than zero', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(Number.NaN)).toBe('—');
  });

  it('keeps a genuine zero distinct from a missing reading', () => {
    expect(pipe.transform(0)).toBe('0');
  });

  it('rounds to the requested precision', () => {
    expect(pipe.transform(12.3456, 2)).toBe('12.35');
    expect(pipe.transform(12.3456)).toBe('12');
  });
});
