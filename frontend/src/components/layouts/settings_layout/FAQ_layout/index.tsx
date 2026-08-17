import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import useFetch from '../../../hooks/useFetch';
import deleteFag from '../../../services/fag/deleteFag';
import Button from '../../../common/button';
import Loader from '../../../common/loader';
import FaqEditorModal from './modals/FaqEditorModal';
import { useStyles } from './styles';

export interface FAQItem {
  _id?: string;
  title: string;
  description: string;
  items: Array<{ title: string; description: string }>;
}

type EditorState = { open: boolean; mode: 'create' | 'edit'; initial?: FAQItem };

const CreateFAQLayout = () => {
  const classes = useStyles();
  const { data, loading } = useFetch('faq');
  const [faqItems, setFaqItems] = useState<Array<FAQItem>>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ open: false, mode: 'create' });

  useEffect(() => {
    if (Array.isArray(data?.data)) setFaqItems(data.data);
  }, [data]);

  const totalQuestions = useMemo(
    () => faqItems.reduce((sum, f) => sum + (f.items?.length || 0), 0),
    [faqItems],
  );

  const confirmDeleteFaq = async (id: string): Promise<void> => {
    if (!window.confirm('Delete this FAQ section? This cannot be undone.')) return;
    setDeletingId(id);
    const { success } = await deleteFag(id);
    if (success) {
      setFaqItems((prev) => prev.filter((item) => item._id !== id));
      toast.success('FAQ section deleted');
    } else {
      toast.error('Could not delete FAQ section');
    }
    setDeletingId(null);
  };

  const onSaved = (faq: FAQItem, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setFaqItems((prev) => [faq, ...prev]);
    } else {
      setFaqItems((prev) => prev.map((item) => (item._id === faq._id ? faq : item)));
    }
  };

  if (loading) return <Loader />;

  return (
    <div className={classes.page} data-testid="faq-layout">
      <header className={classes.hero}>
        <div>
          <p className={classes.eyebrow}>Контент публичного сайта</p>
          <h2 className={classes.title}>FAQ</h2>
          <p className={classes.heroDescription}>
            Управляйте вопросами и ответами публичной страницы FAQ. Группируйте их в понятные разделы и держите формулировки короткими и полезными.
          </p>
        </div>
        <span className={classes.countBadge} aria-live="polite">
          <span className={classes.badgeDot} />
          {faqItems.length} разделов / {totalQuestions} вопросов
        </span>
      </header>

      <section className={classes.panel} aria-labelledby="faq-sections-title">
        <div className={classes.panelHeader}>
          <div className={classes.panelHeaderText}>
            <div className={classes.panelTitleRow}>
              <h3 className={classes.panelTitle} id="faq-sections-title">Разделы FAQ</h3>
              <span className={classes.panelPill}>{faqItems.length} всего</span>
            </div>
            <p className={classes.panelDescription}>
              Каждый раздел может содержать несколько пар «вопрос/ответ». Сортировка — сначала новые.
            </p>
          </div>
          <Button
            className={classes.addButton}
            type="fill"
            onClick={() => setEditor({ open: true, mode: 'create' })}
          >
            + Добавить раздел
          </Button>
        </div>

        {faqItems.length === 0 ? (
          <div className={classes.emptyState} data-testid="faq-empty">
            <div className={classes.emptyTitle}>Разделов FAQ пока нет</div>
            <div className={classes.emptyText}>
              Создайте первый раздел, чтобы начать наполнять публичную страницу FAQ.
            </div>
            <Button type="fill" onClick={() => setEditor({ open: true, mode: 'create' })}>
              + Добавить раздел
            </Button>
          </div>
        ) : (
          <div className={classes.grid}>
            {faqItems.map((faqItem, index) => {
              const count = faqItem.items?.length || 0;
              const firstQuestion = faqItem.items?.[0]?.title || '';
              return (
                <article className={classes.card} key={faqItem._id || index} data-testid="faq-card">
                  <div className={classes.cardTop}>
                    <div className={classes.icon} aria-hidden="true">
                      {(faqItem.title || '?').slice(0, 1)}
                    </div>
                    <span className={`${classes.statusPill} ${count ? '' : classes.emptyStatus}`}>
                      {count ? `${count} вопрос(ов)` : 'Нет вопросов'}
                    </span>
                  </div>
                  <div>
                    <h4 className={classes.cardTitle}>{faqItem.title || 'Без названия'}</h4>
                    {faqItem.description ? (
                      <p className={classes.cardDescription}>{faqItem.description}</p>
                    ) : null}
                  </div>
                  <p className={`${classes.excerpt} ${firstQuestion ? '' : classes.emptyExcerpt}`}>
                    {firstQuestion ? `Первый вопрос: ${firstQuestion}` : 'Добавьте первый вопрос в этот раздел.'}
                  </p>
                  <div className={classes.cardFooter}>
                    <span className={classes.cardMeta}>{count} вопрос(ов)</span>
                    <div className={classes.cardActions}>
                      <Button
                        className={classes.editButton}
                        type="lightFill"
                        onClick={() => setEditor({ open: true, mode: 'edit', initial: faqItem })}
                      >
                        Редактировать
                      </Button>
                      <Button
                        className={classes.deleteButton}
                        type="bordered"
                        disabled={deletingId === faqItem._id}
                        onClick={() => confirmDeleteFaq(String(faqItem._id))}
                      >
                        {deletingId === faqItem._id ? '...' : 'Удалить'}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <FaqEditorModal
        open={editor.open}
        mode={editor.mode}
        initial={editor.initial}
        onClose={() => setEditor({ open: false, mode: 'create' })}
        onSaved={onSaved}
      />
    </div>
  );
};

export default CreateFAQLayout;
