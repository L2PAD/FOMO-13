import { FC, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import RichTextEditor from '../rich_text_editor/RichTextEditor';
import Modal from '../modal';
import Button from '../button';
import { useStyles } from './styles';

interface IProps {
  title: string;
  value: string;
  onChange?: (value: string, name: string) => void;
  onClose: () => void;
  onClick?: () => void | Promise<void>;
  onSave?: (value: string) => boolean | void | Promise<boolean | void>;
  name?: string;
  description?: string;
  ariaLabel?: string;
  saveLabel?: string;
  confirmDiscard?: boolean;
  maxHtmlLength?: number;
  maxPlainLength?: number;
}

const TextModal: FC<IProps> = ({
  title,
  value,
  onChange,
  onClose,
  onClick,
  onSave,
  name = 'text',
  description = 'Format the document visually, edit its HTML source, or review the final result before publishing.',
  ariaLabel,
  saveLabel = 'Save changes',
  confirmDiscard = false,
  maxHtmlLength = 200_000,
  maxPlainLength = 50_000,
}) => {
  const classes = useStyles();
  const [draft, setDraft] = useState(value);
  const [baseline, setBaseline] = useState(value);
  const [saving, setSaving] = useState(false);
  const [overLimit, setOverLimit] = useState(false);
  const lastEmittedValue = useRef('');
  const deferred = Boolean(onSave);
  const dirty = draft !== baseline;

  useEffect(() => {
    if (value === lastEmittedValue.current) {
      lastEmittedValue.current = '';
      return;
    }
    setDraft(value);
    setBaseline(value);
  }, [value]);

  const emitLegacyChange = (nextValue: string) => {
    if (deferred || !onChange) return;
    lastEmittedValue.current = nextValue;
    onChange(nextValue, name);
  };

  const handleChange = (nextValue: string) => {
    setDraft(nextValue);
    emitLegacyChange(nextValue);
  };

  const reset = () => {
    setDraft(baseline);
    emitLegacyChange(baseline);
  };

  const close = () => {
    if (saving) return;
    if (dirty && confirmDiscard) {
      const shouldDiscard = window.confirm('Discard your unsaved changes?');
      if (!shouldDiscard) return;
      if (!deferred) emitLegacyChange(baseline);
    }
    onClose();
  };

  const save = async () => {
    if (saving || overLimit || (deferred && !dirty)) return;
    setSaving(true);
    try {
      if (onSave) {
        const result = await onSave(draft);
        if (result === false) return;
        setBaseline(draft);
        onClose();
        return;
      }
      await onClick?.();
      setBaseline(draft);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} variant="editor" onClose={close}>
      <div className={classes.content}>
        <div className={classes.intro}>
          <p className={classes.description}>{description}</p>
          <span className={`${classes.status} ${dirty ? '' : classes.statusClean}`}>
            {dirty ? 'Unsaved changes' : 'Up to date'}
          </span>
        </div>

        <RichTextEditor
          value={draft}
          onChange={(html) => handleChange(html)}
          ariaLabel={ariaLabel || `${title} editor`}
          minHeight={430}
          maxHtmlLength={maxHtmlLength}
          maxPlainLength={maxPlainLength}
          disabled={saving}
          onLimitChange={setOverLimit}
        />

        <div className={classes.actionBar}>
          <p className={overLimit ? classes.limitError : classes.actionHint}>
            {overLimit
              ? 'The document exceeds the allowed length. Shorten it before saving.'
              : deferred
                ? 'Changes are published only after a successful save.'
                : 'Review the Preview tab before saving formatted content.'}
          </p>
          <div className={classes.actions}>
            <Button type="bordered" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button type="lightFill" onClick={reset} disabled={!dirty || saving}>
              Reset
            </Button>
            <Button
              className={classes.saveButton}
              type="fill"
              onClick={save}
              disabled={saving || overLimit || (deferred && !dirty)}
            >
              {saving ? 'Saving...' : saveLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TextModal;
