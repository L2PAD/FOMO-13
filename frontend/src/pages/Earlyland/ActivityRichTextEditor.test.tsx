import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import ActivityRichTextEditor from './ActivityRichTextEditor';

describe('ActivityRichTextEditor', () => {
  it('uses the backend-compatible allowlist for preview markup', () => {
    render(
      <ActivityRichTextEditor
        ariaLabel="About description"
        value={'<h2 onclick="steal()">About</h2><script>alert(1)</script><a href="javascript:alert(2)">Bad link</a><table><tbody><tr><td>Value</td></tr></tbody></table>'}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('status').textContent).toContain('Visual editing is locked');
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));

    const preview = screen.getByTitle('About description preview');
    const source = preview.getAttribute('srcdoc') || '';
    expect(source).toContain('Content-Security-Policy');
    expect(source).toContain('<h2>About</h2>');
    expect(source).toContain('<a>Bad link</a>');
    expect(source).toContain('<table>');
    expect(source).not.toMatch(/onclick|<script|javascript:/i);
  });

  it('updates HTML and the sanitized plain-text fallback together', () => {
    const onChange = jest.fn();
    render(
      <ActivityRichTextEditor
        ariaLabel="Review text"
        value=""
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'HTML' }));
    fireEvent.change(screen.getByLabelText('Review text HTML source'), {
      target: { value: '<p>Visible <strong>text</strong></p><script>hidden</script>' },
    });

    expect(onChange).toHaveBeenLastCalledWith(
      '<p>Visible <strong>text</strong></p><script>hidden</script>',
      'Visible text',
    );
  });
});
