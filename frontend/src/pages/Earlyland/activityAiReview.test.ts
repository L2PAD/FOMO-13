import {
  areActivityAiValuesEqual,
  buildActivityAiReviewItems,
  getDefaultActivityAiPaths,
} from './activityAiReview';

describe('activityAiReview', () => {
  it('compares object values independently of key order', () => {
    expect(areActivityAiValuesEqual({ b: 2, a: 1 }, { a: 1, b: 2 })).toBe(true);
  });

  it('groups plain text and HTML changes into one atomic review item', () => {
    const items = buildActivityAiReviewItems([
      { path: 'description.about', currentValue: 'Before', proposedValue: 'After' },
      { path: 'description.aboutHtml', currentValue: '<p>Before</p>', proposedValue: '<p>After</p>' },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      label: 'About',
      group: 'Content',
      paths: ['description.about', 'description.aboutHtml'],
      before: 'Before',
      after: 'After',
    });
  });

  it('does not select unchanged or destructive clears by default', () => {
    const items = buildActivityAiReviewItems([
      { path: 'tags', currentValue: ['Airdrop'], proposedValue: ['Airdrop'] },
      { path: 'links', currentValue: [{ label: 'Guide', url: 'https://fomo.cx' }], proposedValue: [] },
      { path: 'review.text', currentValue: '', proposedValue: 'Useful review' },
    ]);

    expect(items.find((item) => item.label === 'Tags')?.unchanged).toBe(true);
    expect(items.find((item) => item.label === 'Additional links')?.destructive).toBe(true);
    expect(getDefaultActivityAiPaths(items)).toEqual(['review.text']);
  });
});
