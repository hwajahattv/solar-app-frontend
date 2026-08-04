import { describe, expect, it } from 'vitest';

import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('renders a dash when the duration is unknown', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(-1)).toBe('—');
  });

  it('omits units that are zero', () => {
    expect(pipe.transform(90 * 60 * 1000)).toBe('1h 30m');
  });

  it('always shows something for very short durations', () => {
    expect(pipe.transform(400)).toBe('0s');
  });

  it('includes days for long-running alarms', () => {
    expect(pipe.transform((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000)).toBe('2d 3h 4m 5s');
  });
});
