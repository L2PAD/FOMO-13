import { durationMinutesToSeconds, normalizePositiveInteger } from './poolForm';

describe('Launchpad pool form exact integers', () => {
  it('trims and canonicalizes integer strings before sending them to the backend', () => {
    expect(normalizePositiveInteger('  00042  ', 'Seats')).toBe('42');
    expect(normalizePositiveInteger(' 0 ', 'Fee', true)).toBe('0');
    expect(() => normalizePositiveInteger(' 0 ', 'Seats')).toThrow('greater than zero');
  });

  it('converts large minute values without Number precision loss', () => {
    expect(durationMinutesToSeconds('9007199254740993', 'Duration'))
      .toBe('540431955284459580');
  });

  it('rejects durations outside the contract uint64 range', () => {
    expect(durationMinutesToSeconds('307445734561825860', 'Duration'))
      .toBe('18446744073709551600');
    expect(() => durationMinutesToSeconds('307445734561825861', 'Duration'))
      .toThrow('uint64');
  });
});
