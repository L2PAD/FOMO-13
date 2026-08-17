import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getReportedComments, deleteComment } from '../../components/services/support';
import { dangerBtn, ghostBtn, Overlay } from '../Advertising/ui';
import { T, card, th, td, Badge, UserCell, Loader, Empty, fmtDate } from './ui';

const CommentsTab: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await getReportedComments();
    setItems(Array.isArray(r.data) ? r.data : (r.data?.data || []));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const onDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    const r = await deleteComment(confirm._id);
    setBusy(false);
    if (r.success) {
      toast.success('Комментарий удалён');
      setItems((prev) => prev.filter((c) => c._id !== confirm._id));
      setConfirm(null);
    } else {
      toast.error('Не удалось удалить комментарий');
    }
  };

  if (loading) return <Loader />;
  if (items.length === 0) return <Empty text="Нет жалоб на комментарии." />;

  return (
    <div>
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>{items.length} комментариев с жалобами</div>
      <div style={{ ...card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }} data-testid="comments-table">
          <thead><tr><th style={th}>Дата</th><th style={th}>Автор</th><th style={th}>Комментарий</th><th style={th}>Расположение</th><th style={th}>Жалобы</th><th style={th}></th></tr></thead>
          <tbody>
            {items.map((c) => {
              const author = c.user || c.author || c.userData || c.creator;
              const text = c.text || c.body || c.message || c.comment || '—';
              const loc = c.page || c.topic || c.topicId || c.pageName || '—';
              const reports = Array.isArray(c.reports) ? c.reports.length : (c.reportsCount || c.reportCount || 0);
              return (
                <tr key={c._id} data-testid={`comment-row-${c._id}`}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: T.sub }}>{fmtDate(c.date || c.createdAt)}</td>
                  <td style={td}><UserCell user={author} /></td>
                  <td style={{ ...td, maxWidth: 320 }}><div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{text}</div></td>
                  <td style={{ ...td, color: T.sub }}>{String(loc)}</td>
                  <td style={td}>{reports > 0 ? <Badge tone="bad">{reports}</Badge> : <Badge>0</Badge>}</td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button data-testid={`comment-delete-${c._id}`} onClick={() => setConfirm(c)} style={{ ...dangerBtn, padding: '7px 12px', fontSize: 12.5 }}>Удалить</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirm ? (
        <Overlay onClose={() => !busy && setConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 'min(420px, 92vw)', marginTop: 80 }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Удалить комментарий?</div>
            <div style={{ fontSize: 14, color: T.sub, marginBottom: 20 }}>Комментарий с жалобой будет удалён без возможности восстановления.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)} disabled={busy} style={ghostBtn}>Отмена</button>
              <button onClick={onDelete} disabled={busy} data-testid="comment-delete-confirm" style={dangerBtn}>{busy ? 'Удаление…' : 'Удалить'}</button>
            </div>
          </div>
        </Overlay>
      ) : null}
    </div>
  );
};

export default CommentsTab;
