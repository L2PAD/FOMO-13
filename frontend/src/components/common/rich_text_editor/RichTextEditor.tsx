import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Editor } from 'react-draft-wysiwyg';
import styled from 'styled-components';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

export interface RichTextEditorProps {
  value?: string;
  onChange: (html: string, plainText: string) => void;
  ariaLabel?: string;
  minHeight?: number;
  maxHtmlLength?: number;
  maxPlainLength?: number;
  disabled?: boolean;
  onLimitChange?: (overLimit: boolean) => void;
}

const normalizeHtml = (value?: string): string => String(value || '');

const allowedHtmlTags = new Set([
  'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong',
  'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
]);

const removedHtmlTags = new Set([
  'base', 'embed', 'form', 'iframe', 'input', 'link', 'meta', 'object', 'script',
  'style', 'svg', 'template',
]);

const allowedHtmlAttributes: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
};

const isSafeUrl = (
  value: string,
  options: { anchor?: boolean; mailto?: boolean } = {},
): boolean => {
  const url = value.trim();
  if (!url) return false;
  if (options.anchor && url.startsWith('#')) return true;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  if (options.mailto && /^mailto:[^\s]+$/i.test(url)) return true;
  return /^https?:\/\/[^\s]+$/i.test(url);
};

/** Preview never receives the raw HTML entered by an admin. */
const sanitizeEditorHtml = (value: string): string => {
  const compatibleHtml = value
    .replace(/<\/?ins(?=\s|>)/gi, (tag) => tag.replace(/ins/i, 'u'))
    .replace(/<\/?del(?=\s|>)/gi, (tag) => tag.replace(/del/i, 's'));

  if (typeof DOMParser === 'undefined') {
    return compatibleHtml
      .replace(/<(script|style|iframe|object|embed|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(script|style|iframe|object|embed|svg|template)\b[^>]*\/?\s*>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '');
  }

  const document = new DOMParser().parseFromString(compatibleHtml, 'text/html');
  Array.from(document.body.querySelectorAll('*')).forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (removedHtmlTags.has(tag)) {
      node.remove();
      return;
    }
    if (!allowedHtmlTags.has(tag)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    const allowedAttributes = allowedHtmlAttributes[tag] || new Set<string>();
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (!allowedAttributes.has(name) || name.startsWith('on')) {
        node.removeAttribute(attribute.name);
      }
    });

    if (tag === 'a') {
      const href = node.getAttribute('href');
      if (href && !isSafeUrl(href, { anchor: true, mailto: true })) {
        node.removeAttribute('href');
      }
      if (node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer nofollow');
      }
    }

    if (tag === 'img') {
      const src = node.getAttribute('src');
      if (src && !isSafeUrl(src)) node.removeAttribute('src');
    }
  });

  return document.body.innerHTML;
};

const visualHtmlTags = new Set([
  'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'i', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong', 'u', 'ul',
]);

const containsSourceOnlyMarkup = (value: string): boolean => {
  if (!value.trim()) return false;
  if (typeof DOMParser === 'undefined') {
    return /<(?:base|embed|form|hr|iframe|img|input|link|meta|object|script|style|svg|table|tbody|td|template|th|thead|tr)\b|<[a-z][^>]*\s(?:class|data-[\w-]+|id|style)\s*=/i.test(value);
  }

  const document = new DOMParser().parseFromString(value, 'text/html');
  return Array.from(document.body.querySelectorAll('*')).some((node) => {
    const tag = node.tagName.toLowerCase();
    if (!visualHtmlTags.has(tag)) return true;

    return Array.from(node.attributes).some((attribute) => {
      const name = attribute.name.toLowerCase();
      if (
        tag === 'a'
        && (name === 'href' || name === 'target' || name === 'rel' || name === 'title')
      ) return false;
      return true;
    });
  });
};

const previewDocument = (value: string): string => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src http: https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" />
    <meta name="referrer" content="no-referrer" />
    <style>
      body { margin: 0; padding: 16px; color: #101828; font: 14px/1.6 Arial, sans-serif; overflow-wrap: anywhere; }
      h1, h2, h3, h4, h5, h6 { margin: 1.1em 0 0.45em; line-height: 1.25; }
      h1 { font-size: 2em; } h2 { font-size: 1.65em; } h3 { font-size: 1.35em; }
      h4 { font-size: 1.15em; } h5 { font-size: 1em; } h6 { font-size: 0.9em; }
      p { margin: 0 0 0.9em; }
      ul, ol { margin: 0 0 0.9em; padding-left: 1.6em; }
      blockquote { margin: 1em 0; padding: 8px 12px; border-left: 3px solid #0aa584; background: #f4f7f8; }
      img { max-width: 100%; height: auto; }
      table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
      th, td { border: 1px solid #dfe4ea; padding: 7px 9px; text-align: left; }
      pre { overflow-x: auto; padding: 10px; border-radius: 6px; background: #f4f7f8; }
      a { color: #087b65; }
      hr { border: 0; border-top: 1px solid #dfe4ea; margin: 1.2em 0; }
    </style>
  </head>
  <body>${sanitizeEditorHtml(value) || '<p>No content</p>'}</body>
</html>`;

const htmlToEditorState = (value?: string): EditorState => {
  const html = sanitizeEditorHtml(normalizeHtml(value));
  if (!html) return EditorState.createEmpty();
  try {
    const { contentBlocks, entityMap } = htmlToDraft(html);
    return EditorState.createWithContent(
      ContentState.createFromBlockArray(contentBlocks, entityMap),
    );
  } catch (_error) {
    return EditorState.createEmpty();
  }
};

const htmlToPlainText = (value: string): string => {
  if (typeof DOMParser === 'undefined') {
    return value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const document = new DOMParser().parseFromString(value, 'text/html');
  document.body.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
  document.body.querySelectorAll('td,th').forEach((node) => node.append('\t'));
  document.body
    .querySelectorAll('p,div,blockquote,pre,h1,h2,h3,h4,h5,h6,li,tr')
    .forEach((node) => node.append('\n'));
  return String(document.body.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const RichTextEditor: FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  ariaLabel = 'Rich text editor',
  minHeight = 190,
  maxHtmlLength = 200_000,
  maxPlainLength = 50_000,
  disabled = false,
  onLimitChange,
}) => {
  const [mode, setMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [editorState, setEditorState] = useState(() => htmlToEditorState(value));
  const lastEmittedHtml = useRef('');
  const normalizedValue = useMemo(() => normalizeHtml(value), [value]);
  const plainTextLength = useMemo(
    () => htmlToPlainText(sanitizeEditorHtml(value)).length,
    [value],
  );
  const hasSourceOnlyMarkup = useMemo(
    () => containsSourceOnlyMarkup(normalizedValue),
    [normalizedValue],
  );
  const overLimit = plainTextLength > maxPlainLength || value.length > maxHtmlLength;
  const safePreviewDocument = useMemo(
    () => previewDocument(normalizedValue),
    [normalizedValue],
  );

  useEffect(() => {
    if (normalizedValue === lastEmittedHtml.current) {
      lastEmittedHtml.current = '';
      return;
    }
    setEditorState(htmlToEditorState(normalizedValue));
  }, [normalizedValue]);

  useEffect(() => {
    onLimitChange?.(overLimit);
  }, [onLimitChange, overLimit]);

  const updateVisual = (nextState: EditorState) => {
    setEditorState(nextState);
    const content = nextState.getCurrentContent();
    const plainText = content.getPlainText('\n').trim();
    const html = plainText
      ? sanitizeEditorHtml(draftToHtml(convertToRaw(content))).trim()
      : '';
    lastEmittedHtml.current = html;
    onChange(html, plainText);
  };

  const updateSource = (html: string) => {
    const normalized = normalizeHtml(html).slice(0, maxHtmlLength);
    setEditorState(htmlToEditorState(normalized));
    lastEmittedHtml.current = normalized;
    onChange(normalized, htmlToPlainText(sanitizeEditorHtml(normalized)));
  };

  return (
    <EditorShell $minHeight={minHeight}>
      <ModeTabs role="tablist" aria-label={`${ariaLabel} mode`}>
        <ModeButton
          type="button"
          role="tab"
          aria-selected={mode === 'visual'}
          disabled={disabled}
          $active={mode === 'visual'}
          onClick={() => setMode('visual')}
        >
          Visual
        </ModeButton>
        <ModeButton
          type="button"
          role="tab"
          aria-selected={mode === 'html'}
          disabled={disabled}
          $active={mode === 'html'}
          onClick={() => setMode('html')}
        >
          HTML
        </ModeButton>
        <ModeButton
          type="button"
          role="tab"
          aria-selected={mode === 'preview'}
          disabled={disabled}
          $active={mode === 'preview'}
          onClick={() => setMode('preview')}
        >
          Preview
        </ModeButton>
      </ModeTabs>

      {mode === 'visual' ? (
        <>
          {hasSourceOnlyMarkup ? (
            <EditorWarning role="status">
              This content contains source-only HTML. Visual editing is locked to prevent
              data loss; use HTML mode to edit it, then verify the result in Preview.
            </EditorWarning>
          ) : null}
          <Editor
            editorState={editorState}
            onEditorStateChange={updateVisual}
            readOnly={hasSourceOnlyMarkup || disabled}
            toolbarHidden={hasSourceOnlyMarkup || disabled}
            toolbar={{
              options: ['inline', 'blockType', 'list', 'link', 'remove', 'history'],
              inline: { options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'] },
              blockType: { options: ['Normal', 'H2', 'H3', 'H4', 'Blockquote', 'Code'] },
              list: { options: ['unordered', 'ordered', 'indent', 'outdent'] },
              link: { options: ['link', 'unlink'], defaultTargetOption: '_blank', showOpenOptionOnHover: true },
            }}
            toolbarClassName="rich-text-editor__toolbar"
            wrapperClassName="rich-text-editor__wrapper"
            editorClassName="rich-text-editor__content"
            stripPastedStyles
            ariaLabel={ariaLabel}
          />
        </>
      ) : null}

      {mode === 'html' ? (
        <SourceTextarea
          value={value}
          maxLength={maxHtmlLength}
          onChange={(event) => updateSource(event.target.value)}
          disabled={disabled}
          spellCheck={false}
          aria-label={`${ariaLabel} HTML source`}
        />
      ) : null}

      {mode === 'preview' ? (
        <PreviewFrame
          title={`${ariaLabel} preview`}
          sandbox=""
          referrerPolicy="no-referrer"
          srcDoc={safePreviewDocument}
        />
      ) : null}

      <EditorFooter>
        <span>
          {hasSourceOnlyMarkup
            ? 'Source-only markup is preserved in HTML mode.'
            : mode === 'html'
              ? 'Visual mode supports text, headings, lists and links.'
              : 'Preview filters unsafe markup without changing the saved source.'}
        </span>
        <CharacterCount $overLimit={overLimit}>
          {plainTextLength.toLocaleString()} / {maxPlainLength.toLocaleString()} text
          {' | '}
          {value.length.toLocaleString()} / {maxHtmlLength.toLocaleString()} HTML
        </CharacterCount>
      </EditorFooter>
    </EditorShell>
  );
};

const EditorShell = styled.div<{ $minHeight: number }>`
  overflow: hidden;
  border: 1px solid #dfe4ea;
  border-radius: 10px;
  background: #fff;

  .rich-text-editor__wrapper {
    min-height: ${({ $minHeight }) => `${$minHeight}px`};
  }

  .rich-text-editor__toolbar {
    margin: 0;
    padding: 8px;
    border: 0;
    border-bottom: 1px solid #e8ebef;
    background: #f8fafb;
  }

  .rich-text-editor__content {
    min-height: ${({ $minHeight }) => `${$minHeight - 48}px`};
    padding: 12px 14px;
    font-size: 14px;
    line-height: 1.55;
  }

  .rich-text-editor__content .public-DraftEditor-content {
    min-height: ${({ $minHeight }) => `${$minHeight - 72}px`};
  }
`;

const ModeTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid #e8ebef;
  background: #f4f7f8;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? '#0aa584' : 'transparent')};
  border-radius: 6px;
  padding: 5px 10px;
  background: ${({ $active }) => ($active ? '#e9f8f4' : 'transparent')};
  color: ${({ $active }) => ($active ? '#087b65' : '#667085')};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }
`;

const EditorWarning = styled.div`
  border-bottom: 1px solid #f4d58d;
  padding: 9px 12px;
  background: #fff8e8;
  color: #8a6200;
  font-size: 12px;
  line-height: 17px;
`;

const SourceTextarea = styled.textarea`
  display: block;
  width: 100%;
  min-height: 220px;
  resize: vertical;
  border: 0;
  outline: 0;
  padding: 14px;
  background: #101828;
  color: #e6edf3;
  font: 13px/1.55 Consolas, Monaco, monospace;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.72;
  }
`;

const PreviewFrame = styled.iframe`
  display: block;
  width: 100%;
  min-height: 240px;
  border: 0;
  background: #fff;
`;

const EditorFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  border-top: 1px solid #e8ebef;
  background: #fafbfc;
  color: #7a8492;
  font-size: 11px;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
`;

const CharacterCount = styled.span<{ $overLimit: boolean }>`
  flex-shrink: 0;
  color: ${({ $overLimit }) => ($overLimit ? '#d92d20' : 'inherit')};
  font-weight: ${({ $overLimit }) => ($overLimit ? 600 : 400)};
`;

export default RichTextEditor;
