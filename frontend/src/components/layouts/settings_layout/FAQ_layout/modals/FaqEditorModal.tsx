import { FC, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../../../common/modal';
import Button from '../../../../common/button';
import createFag from '../../../../services/fag/createFag';
import updateFag from '../../../../services/fag/updateFag';
import { FAQItem } from '..';
import { useStyles } from './FaqEditorModal.styles';

interface IProps {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: FAQItem;
  onClose: () => void;
  onSaved: (faq: FAQItem, mode: 'create' | 'edit') => void;
}

const EMPTY: FAQItem = { title: '', description: '', items: [] };

const FaqEditorModal: FC<IProps> = ({ open, mode, initial, onClose, onSaved }) => {
  const classes = useStyles();
  const [faq, setFaq] = useState<FAQItem>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFaq(mode === 'edit' && initial ? { ...EMPTY, ...initial, items: [...(initial.items || [])] } : EMPTY);
  }, [open, mode, initial]);

  if (!open) return null;

  const setField = (name: keyof FAQItem, value: string) => setFaq((p) => ({ ...p, [name]: value }));
  const addItem = () => setFaq((p) => ({ ...p, items: [...p.items, { title: '', description: '' }] }));
  const removeItem = (index: number) => setFaq((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
  const setItem = (index: number, name: 'title' | 'description', value: string) =>
    setFaq((p) => ({ ...p, items: p.items.map((it, i) => (i === index ? { ...it, [name]: value } : it)) }));

  const save = async () => {
    if (!faq.title.trim()) return toast.error('Enter a section title');
    if (faq.items.some((i) => !i.title.trim())) return toast.error('Every question needs a title');
    setSaving(true);
    try {
      if (mode === 'create') {
        const { success, data } = await createFag(faq);
        if (success) {
          toast.success('FAQ section created');
          onSaved(data, 'create');
          onClose();
        } else {
          toast.error('Could not create FAQ section');
        }
      } else {
        const { success } = await updateFag(String(faq._id), faq);
        if (success) {
          toast.success('FAQ section updated');
          onSaved(faq, 'edit');
          onClose();
        } else {
          toast.error('Could not update FAQ section');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal variant="big" title={mode === 'create' ? 'New FAQ section' : 'Edit FAQ section'} onClose={onClose}>
      <div className={classes.form} data-testid="faq-editor">
        <p className={classes.intro}>
          Group related questions under one section. Sections appear on the public FAQ page in the same order shown here.
        </p>

        <div className={classes.field}>
          <label className={classes.label}>Section title</label>
          <input
            className={classes.input}
            value={faq.title}
            data-testid="faq-section-title"
            placeholder="e.g. Getting started"
            onChange={(e) => setField('title', e.target.value)}
          />
        </div>

        <div className={classes.field}>
          <label className={classes.label}>Section description</label>
          <textarea
            className={classes.textarea}
            value={faq.description}
            data-testid="faq-section-description"
            placeholder="Short summary shown under the section title (optional)."
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>

        <div className={classes.questionsSection}>
          <div className={classes.questionsHead}>
            <div className={classes.questionsTitle}>
              Questions
              <span className={classes.questionsPill}>{faq.items.length}</span>
            </div>
            <Button className={classes.addItemBtn} type="lightFill" onClick={addItem}>
              + Add question
            </Button>
          </div>

          {faq.items.length === 0 ? (
            <div className={classes.emptyItems}>No questions yet. Add the first question to this section.</div>
          ) : (
            faq.items.map((item, index) => (
              <div className={classes.itemCard} key={index} data-testid="faq-item-editor">
                <div className={classes.itemHead}>
                  <span className={classes.itemIndex}>
                    <span className={classes.itemDot}>{index + 1}</span>
                    Question {index + 1}
                  </span>
                  <button type="button" className={classes.removeBtn} onClick={() => removeItem(index)} data-testid="faq-item-remove">
                    Remove
                  </button>
                </div>
                <div className={classes.field}>
                  <label className={classes.label}>Question</label>
                  <input
                    className={classes.input}
                    value={item.title}
                    placeholder="What users ask"
                    onChange={(e) => setItem(index, 'title', e.target.value)}
                  />
                </div>
                <div className={classes.field}>
                  <label className={classes.label}>Answer</label>
                  <textarea
                    className={classes.textarea}
                    value={item.description}
                    placeholder="Clear, concise answer"
                    onChange={(e) => setItem(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className={classes.actions}>
          <Button type="lightFill" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <span data-testid="faq-save" style={{ display: 'inline-flex' }}>
            <Button className={classes.saveButton} type="fill" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : mode === 'create' ? 'Create section' : 'Save changes'}
            </Button>
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default FaqEditorModal;
