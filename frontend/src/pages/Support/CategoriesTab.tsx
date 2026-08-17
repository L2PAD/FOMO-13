import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { trust } from '../../components/services/support';
import OptionSelect from '../Advertising/OptionSelect';
import { primaryBtn, ghostBtn, dangerBtn, field } from '../Advertising/ui';
import { T, card, Badge, Loader } from './ui';

const CategoryRow: React.FC<{ node: any; depth: number; onToggle: (c: any) => void; onDelete: (c: any) => void }> = ({ node, depth, onToggle, onDelete }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: `1px solid ${T.border}`, paddingLeft: 12 + depth * 22 }} data-testid={`cat-${node.code}`}>
      {node.icon ? <span style={{ color: T.accent, fontSize: 12 }}>◆</span> : <span style={{ color: T.faint, fontSize: 12 }}>•</span>}
      <b style={{ fontSize: 13.5, color: T.ink }}>{node.name}</b>
      <span style={{ fontSize: 11.5, color: T.faint, fontFamily: 'monospace' }}>{node.code}</span>
      {node.source === 'system' ? <Badge tone="info">system</Badge> : <Badge>custom</Badge>}
      {!node.active ? <Badge tone="warn">off</Badge> : null}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <button onClick={() => onToggle(node)} style={{ ...ghostBtn, padding: '4px 10px', fontSize: 12 }}>{node.active ? 'Выкл' : 'Вкл'}</button>
        {node.source !== 'system' ? <button onClick={() => onDelete(node)} style={{ ...dangerBtn, padding: '4px 10px', fontSize: 12 }}>Удалить</button> : null}
      </div>
    </div>
    {(node.children || []).map((ch: any) => <CategoryRow key={ch.code} node={ch} depth={depth + 1} onToggle={onToggle} onDelete={onDelete} />)}
  </>
);

const CategoriesTab: React.FC = () => {
  const [tree, setTree] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nc, setNc] = useState({ code: '', name: '', parentCode: '' });
  const [nr, setNr] = useState({ code: '', label: '', allowedTargetTypes: 'USER' });

  const load = async () => { setLoading(true); const [c, r] = await Promise.all([trust.categoriesTree(), trust.reasons()]); setTree(c.data || []); setReasons(r.data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const flat = (nodes: any[]): any[] => nodes.reduce((acc: any[], n: any) => [...acc, n, ...flat(n.children || [])], []);
  const parents = flat(tree);

  const addCat = async () => {
    if (!nc.code || !nc.name) return toast.error('code и name обязательны');
    const r = await trust.createCategory(nc); if (r.success) { toast.success('Категория создана'); setNc({ code: '', name: '', parentCode: '' }); load(); } else toast.error(r.data?.message || 'Ошибка');
  };
  const toggleCat = async (c: any) => { const r = await trust.updateCategory(c.code, { active: !c.active }); if (r.success) load(); };
  const delCat = async (c: any) => { const r = await trust.deleteCategory(c.code); if (r.success) { toast.success('Удалено'); load(); } else toast.error(r.data?.message || 'Нельзя удалить'); };

  const addReason = async () => {
    if (!nr.code || !nr.label) return toast.error('code и label обязательны');
    const r = await trust.createReason({ ...nr, allowedTargetTypes: nr.allowedTargetTypes.split(',').map((s) => s.trim()).filter(Boolean) });
    if (r.success) { toast.success('Причина создана'); setNr({ code: '', label: '', allowedTargetTypes: 'USER' }); load(); } else toast.error(r.data?.message || 'Ошибка');
  };
  const toggleReason = async (x: any) => { const r = await trust.updateReason(x.code, { active: !x.active }); if (r.success) load(); };
  const delReason = async (x: any) => { const r = await trust.deleteReason(x.code); if (r.success) { toast.success('Удалено'); load(); } else toast.error(r.data?.message || 'Системную причину нельзя удалить'); };

  if (loading) return <Loader />;
  const inp = { ...field, padding: '8px 10px', fontSize: 13 } as React.CSSProperties;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Категории поддержки (дерево)</div>
        <div style={{ ...card, marginBottom: 12 }} data-testid="categories-tree">
          {tree.map((n) => <CategoryRow key={n.code} node={n} depth={0} onToggle={toggleCat} onDelete={delCat} />)}
        </div>
        <div style={{ ...card, padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="code" value={nc.code} onChange={(e) => setNc({ ...nc, code: e.target.value })} style={{ ...inp, width: 120 }} data-testid="new-cat-code" />
          <input placeholder="Название" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} style={{ ...inp, flex: 1, minWidth: 120 }} data-testid="new-cat-name" />
          <div style={{ minWidth: 160 }}>
            <OptionSelect label="" value={nc.parentCode} onChange={(v) => setNc({ ...nc, parentCode: v })} testid="new-cat-parent"
              options={[{ value: '', label: '— корень —' }, ...parents.map((p) => ({ value: p.code, label: p.name }))]} />
          </div>
          <button onClick={addCat} style={primaryBtn} data-testid="new-cat-add">Добавить</button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Реестр причин жалоб</div>
        <div style={{ ...card, marginBottom: 12 }} data-testid="reasons-list">
          {reasons.map((x) => (
            <div key={x.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: `1px solid ${T.border}` }} data-testid={`reason-${x.code}`}>
              <b style={{ fontSize: 13.5, color: T.ink }}>{x.label}</b>
              <span style={{ fontSize: 11, color: T.faint, fontFamily: 'monospace' }}>{x.code}</span>
              {x.reasonClass === 'system' ? <Badge tone="info">system</Badge> : <Badge>custom</Badge>}
              {!x.active ? <Badge tone="warn">off</Badge> : null}
              <span style={{ fontSize: 11, color: T.sub }}>{(x.allowedTargetTypes || []).join(', ')}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button onClick={() => toggleReason(x)} style={{ ...ghostBtn, padding: '4px 10px', fontSize: 12 }}>{x.active ? 'Выкл' : 'Вкл'}</button>
                {x.reasonClass !== 'system' ? <button onClick={() => delReason(x)} style={{ ...dangerBtn, padding: '4px 10px', fontSize: 12 }}>Удалить</button> : null}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="code" value={nr.code} onChange={(e) => setNr({ ...nr, code: e.target.value })} style={{ ...inp, width: 120 }} data-testid="new-reason-code" />
          <input placeholder="Название" value={nr.label} onChange={(e) => setNr({ ...nr, label: e.target.value })} style={{ ...inp, flex: 1, minWidth: 120 }} data-testid="new-reason-label" />
          <input placeholder="USER,COMMENT" value={nr.allowedTargetTypes} onChange={(e) => setNr({ ...nr, allowedTargetTypes: e.target.value })} style={{ ...inp, minWidth: 140 }} data-testid="new-reason-targets" />
          <button onClick={addReason} style={primaryBtn} data-testid="new-reason-add">Добавить</button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesTab;
