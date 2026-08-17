import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ActivityAiReviewModal from './ActivityAiReviewModal';
import { ActivityAiReviewItem } from './activityAiReview';

const changedItem: ActivityAiReviewItem = {
  id: 'description.about|description.aboutHtml',
  paths: ['description.about', 'description.aboutHtml'],
  label: 'About',
  group: 'Content',
  before: 'Old overview',
  after: 'Clearer overview',
  unchanged: false,
  destructive: false,
};

const unchangedItem: ActivityAiReviewItem = {
  id: 'tags',
  paths: ['tags'],
  label: 'Tags',
  group: 'Overview',
  before: ['Airdrop'],
  after: ['Airdrop'],
  unchanged: true,
  destructive: false,
};

const renderModal = (overrides: Partial<React.ComponentProps<typeof ActivityAiReviewModal>> = {}) => {
  const props: React.ComponentProps<typeof ActivityAiReviewModal> = {
    activityName: 'Blast',
    proposal: {
      id: 'proposal-1',
      status: 'proposed',
      model: 'gpt-test',
      summary: 'Improves clarity.',
      warnings: ['Reward details are missing.'],
    },
    items: [changedItem, unchangedItem],
    selectedPaths: changedItem.paths,
    busy: false,
    hasUnsavedChanges: false,
    onSelectionChange: jest.fn(),
    onApply: jest.fn(),
    onReject: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };

  render(<ActivityAiReviewModal {...props} />);
  return props;
};

describe('ActivityAiReviewModal', () => {
  it('renders a focused Before and After comparison and hides no-op fields', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Review AI proposal' })).toBeTruthy();
    expect(screen.getAllByText('Before · current saved').length).toBeGreaterThan(0);
    expect(screen.getAllByText('After · AI proposal').length).toBeGreaterThan(0);
    expect(screen.getByText('Old overview')).toBeTruthy();
    expect(screen.getByText('Clearer overview')).toBeTruthy();
    expect(screen.queryByLabelText('Apply Tags')).toBeNull();
    expect(screen.getByRole('status', { name: 'AI summary and warnings' })).toBeTruthy();
    expect(screen.getByText('AI notes · 2')).toBeTruthy();
    expect(screen.getAllByText(/Improves clarity\./).length).toBe(2);
    expect(screen.getAllByText(/Reward details are missing\./).length).toBe(2);
  });

  it('toggles paired rich-text paths atomically', () => {
    const onSelectionChange = jest.fn();
    renderModal({ selectedPaths: [], onSelectionChange });

    fireEvent.click(screen.getByLabelText('Apply About'));

    expect(onSelectionChange).toHaveBeenCalledWith([
      'description.about',
      'description.aboutHtml',
    ]);
  });

  it('requires an explicit rejection confirmation and forwards the reason', () => {
    const onReject = jest.fn();
    renderModal({ onReject });

    fireEvent.click(screen.getByRole('button', { name: 'Reject proposal' }));
    fireEvent.change(screen.getByLabelText('AI proposal rejection reason'), {
      target: { value: 'The proposal removes important context.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));

    expect(onReject).toHaveBeenCalledWith('The proposal removes important context.');
  });

  it('closes with Escape when no action is running', () => {
    const onClose = jest.fn();
    renderModal({ onClose });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('blocks apply and reject while manual edits are unsaved', () => {
    renderModal({ hasUnsavedChanges: true });

    expect((screen.getByRole('button', { name: 'Reject proposal' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Apply selected (1)' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/before applying or rejecting this proposal/i)).toBeTruthy();
  });
});
