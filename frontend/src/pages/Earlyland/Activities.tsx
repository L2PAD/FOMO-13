import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/layouts/main_layout/layout';
import Loader from '../../components/common/loader';
import loader from '../../components/services/loader';
import {
  fetchFomoV2Activities,
  createFomoV2Activity,
  FomoV2ActivityCounts,
  FomoV2AdminActivity,
  getFomoV2ActivityKey,
  importFomoV2Activities,
} from '../../components/services/fomoV2Activities';
import { AdminSelect } from '../AdminRating/AdminControls';
import { T } from '../Statistics/ui';
import {
  ActivityRow,
  Cell,
  CountTab,
  CountTabs,
  EmptyText,
  ErrorText,
  Field,
  FieldLabel,
  FiltersCard,
  HeaderRow,
  HeaderWrapper,
  Logo,
  MutedText,
  OpenButton,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  PaginationButton,
  PaginationWrapper,
  ProjectCell,
  ProjectMeta,
  ProjectTitle,
  SearchButton,
  SearchInput,
  SearchWrapper,
  StatusBadge,
  TableWrapper,
} from './ActivitiesStyles';

const LIMIT = 50;

type QuickFilter = 'all' | 'ingested' | 'pending_ai' | 'pending_human' | 'needs_changes' | 'approved' | 'published' | 'hidden';

const titleOf = (activity: FomoV2AdminActivity): string => (
  activity.projectName || activity.name || activity.coinName || 'Activity'
);

const logoOf = (activity: FomoV2AdminActivity): string => (
  activity.projectLogo || activity.logo || ''
);

const formatDate = (value?: string | number | null): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const STATUS_RU: Record<string, string> = {
  ingested: 'Импортировано',
  pending_ai: 'Ожидает AI',
  pending_human: 'На проверке',
  needs_changes: 'Нужны правки',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  draft: 'Черновик',
  published: 'Опубликовано',
  hidden: 'Скрыто',
  archived: 'Архив',
  public: 'Public',
  prime: 'Prime',
  upcoming: 'Скоро',
  active: 'Активно',
  ended: 'Завершено',
  cancelled: 'Отменено',
  unprocessed: 'Не обработано',
  proposed: 'Предложено',
  verified: 'Подтверждено',
  conflict: 'Конфликт',
  no_candidates: 'Нет кандидатов',
  'not set': 'Не задано',
};

const displayStatus = (value?: string | null): string => {
  const key = String(value || 'not set');
  return STATUS_RU[key] || key.replace(/_/g, ' ');
};

const toneFor = (value?: string | null): string => {
  const normalized = String(value || '').toLowerCase();
  if (['approved', 'published', 'verified', 'public', 'active', 'live'].includes(normalized)) return 'green';
  if (['rejected', 'hidden', 'conflict', 'archived'].includes(normalized)) return 'red';
  if (['pending_human', 'needs_changes', 'pending_ai', 'proposed'].includes(normalized)) return 'yellow';
  if (['prime', 'ai_ready', 'draft'].includes(normalized)) return 'blue';
  return 'gray';
};

const ActivitiesPage = ({ embedded = false, forcedTier }: { embedded?: boolean; forcedTier?: 'prime' | 'public' } = {}) => {
  const history = useHistory();
  const [activities, setActivities] = useState<FomoV2AdminActivity[]>([]);
  const [counts, setCounts] = useState<FomoV2ActivityCounts | undefined>();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cName, setCName] = useState('');
  const [cType, setCType] = useState('Testnet');
  const [cTier, setCTier] = useState<'public' | 'prime'>('prime');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('');
  const [accessTier, setAccessTier] = useState(forcedTier || '');
  const [canonicalStatus, setCanonicalStatus] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const fallbackCountsRequested = useRef(false);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchFomoV2Activities({
        search,
        reviewStatus,
        publicationStatus,
        accessTier,
        canonicalStatus,
        limit: LIMIT,
        offset,
      });
      setActivities(response.items);
      setTotal(response.total);
      if (response.counts) {
        setCounts(response.counts);
      } else if (!fallbackCountsRequested.current) {
        fallbackCountsRequested.current = true;
        const reviewStates = ['ingested', 'pending_ai', 'pending_human', 'needs_changes'];
        Promise.all([
          fetchFomoV2Activities({ limit: 1, offset: 0 }),
          ...reviewStates.map((status) => fetchFomoV2Activities({ reviewStatus: status, limit: 1, offset: 0 })),
          fetchFomoV2Activities({ reviewStatus: 'approved', limit: 1, offset: 0 }),
          fetchFomoV2Activities({ publicationStatus: 'published', limit: 1, offset: 0 }),
          fetchFomoV2Activities({ publicationStatus: 'hidden', limit: 1, offset: 0 }),
        ]).then(([all, ...buckets]) => {
          setCounts({
            all: all.total,
            byReviewStatus: {
              ingested: buckets[0].total,
              'pending_ai': buckets[1].total,
              'pending_human': buckets[2].total,
              'needs_changes': buckets[3].total,
              approved: buckets[4].total,
            },
            byPublicationStatus: {
              published: buckets[5].total,
              hidden: buckets[6].total,
            },
          });
        }).catch(() => {
          fallbackCountsRequested.current = false;
        });
      }
    } catch (requestError) {
      setActivities([]);
      setTotal(0);
      setError(requestError instanceof Error ? requestError.message : 'Не удалось загрузить активности');
    } finally {
      setLoading(false);
    }
  }, [accessTier, canonicalStatus, offset, publicationStatus, reviewStatus, search]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const resetPage = () => setOffset(0);

  const applyQuickFilter = (next: QuickFilter) => {
    setQuickFilter(next);
    resetPage();
    if (['ingested', 'pending_ai', 'pending_human', 'needs_changes', 'approved'].includes(next)) {
      setReviewStatus(next);
      setPublicationStatus('');
    } else if (next === 'published') {
      setReviewStatus('');
      setPublicationStatus('published');
    } else if (next === 'hidden') {
      setReviewStatus('');
      setPublicationStatus('hidden');
    } else {
      setReviewStatus('');
      setPublicationStatus('');
    }
  };

  const statusCounts = useMemo<Record<QuickFilter, number>>(() => ({
    all: Number(counts?.all ?? total),
    ingested: Number(counts?.byReviewStatus?.ingested || 0),
    'pending_ai': Number(counts?.byReviewStatus?.['pending_ai'] || 0),
    'pending_human': Number(counts?.byReviewStatus?.['pending_human'] || 0),
    'needs_changes': Number(counts?.byReviewStatus?.['needs_changes'] || 0),
    approved: Number(counts?.byReviewStatus?.approved || 0),
    published: Number(counts?.byPublicationStatus?.published || 0),
    hidden: Number(counts?.byPublicationStatus?.hidden || 0),
  }), [counts, total]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetPage();
    setSearch(searchInput.trim());
  };

  const importNow = async () => {
    setImporting(true);
    setError('');
    try {
      const result = await importFomoV2Activities({ source: 'all', limit: 100 });
      fallbackCountsRequested.current = false;
      await loadActivities();
      const { counts } = result;
      toast.success(
        `Импорт завершён: создано ${counts.created}, обновлено ${counts.updated}, без изменений ${counts.skippedUnchanged}`,
      );
      if (counts.failed || counts.skippedInvalid) {
        toast.warning(`${counts.failed} с ошибкой, ${counts.skippedInvalid} некорректных строк источника`);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось выполнить импорт';
      setError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const onFilter = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setQuickFilter('all');
    resetPage();
    setter(value);
  };

  const createNow = async () => {
    const name = cName.trim();
    if (!name) {
      toast.warning('Введите название активности');
      return;
    }
    setCreating(true);
    try {
      const created = await createFomoV2Activity({ name, activityType: cType, accessTier: cTier });
      toast.success('Активность создана — открываю редактор');
      const key = getFomoV2ActivityKey(created);
      history.push(`/early_land/activities/${encodeURIComponent(key)}`);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось создать активность';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const Shell: React.ElementType = embedded ? React.Fragment : Layout;

  return (
    <Shell>
      <PageWrapper style={embedded ? { padding: 0 } : undefined}>
        <HeaderWrapper>
          <div>
            {!embedded ? <PageTitle>Активности EarlyLand</PageTitle> : null}
            {!embedded ? <PageSubtitle>Очередь проверки и публикации активностей EarlyLand</PageSubtitle> : null}
          </div>
          <SearchWrapper onSubmit={submitSearch}>
            <SearchInput
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Поиск по проекту, slug или источнику"
            />
            <SearchButton type="submit">Поиск</SearchButton>
          </SearchWrapper>
        </HeaderWrapper>

        <CountTabs>
          {(
            [
              ['all', 'Все'],
              ['ingested', 'Импортировано'],
              ['pending_ai', 'Ожидает AI'],
              ['pending_human', 'На проверке'],
              ['needs_changes', 'Нужны правки'],
              ['approved', 'Одобрено'],
              ['published', 'Опубликовано'],
              ['hidden', 'Скрыто'],
            ] as Array<[QuickFilter, string]>
          ).map(([key, label]) => (
            <CountTab
              key={key}
              type="button"
              $active={quickFilter === key}
              onClick={() => applyQuickFilter(key)}
            >
              {label} · {statusCounts[key]}
            </CountTab>
          ))}
        </CountTabs>

        <FiltersCard>
          <Field>
            <FieldLabel>Проверка</FieldLabel>
            <AdminSelect
              value={reviewStatus}
              onChange={onFilter(setReviewStatus)}
              placeholder="Все статусы проверки"
              options={[
                { value: '', label: 'Все статусы проверки' },
                { value: 'ingested', label: 'Импортировано' },
                { value: 'pending_ai', label: 'Ожидает AI' },
                { value: 'pending_human', label: 'На проверке' },
                { value: 'needs_changes', label: 'Нужны правки' },
                { value: 'approved', label: 'Одобрено' },
                { value: 'rejected', label: 'Отклонено' },
              ]}
            />
          </Field>
          <Field>
            <FieldLabel>Публикация</FieldLabel>
            <AdminSelect
              value={publicationStatus}
              onChange={onFilter(setPublicationStatus)}
              placeholder="Все статусы публикации"
              options={[
                { value: '', label: 'Все статусы публикации' },
                { value: 'draft', label: 'Черновик' },
                { value: 'published', label: 'Опубликовано' },
                { value: 'hidden', label: 'Скрыто' },
                { value: 'archived', label: 'Архив' },
              ]}
            />
          </Field>
          <Field>
            <FieldLabel>Доступ</FieldLabel>
            <AdminSelect
              value={accessTier}
              onChange={onFilter(setAccessTier)}
              placeholder="Public и Prime"
              disabled={!!forcedTier}
              options={[
                { value: '', label: 'Public и Prime' },
                { value: 'public', label: 'Public' },
                { value: 'prime', label: 'Prime' },
              ]}
            />
          </Field>
          <Field>
            <FieldLabel>Каноническая связь</FieldLabel>
            <AdminSelect
              value={canonicalStatus}
              onChange={onFilter(setCanonicalStatus)}
              placeholder="Все канонические статусы"
              options={[
                { value: '', label: 'Все канонические статусы' },
                { value: 'unprocessed', label: 'Не обработано' },
                { value: 'proposed', label: 'Предложено' },
                { value: 'verified', label: 'Подтверждено' },
                { value: 'conflict', label: 'Конфликт' },
                { value: 'rejected', label: 'Отклонено' },
                { value: 'no_candidates', label: 'Нет кандидатов' },
              ]}
            />
          </Field>
          <OpenButton type="button" onClick={loadActivities} disabled={loading}>
            Обновить
          </OpenButton>
          <OpenButton type="button" onClick={importNow} disabled={loading || importing}>
            {importing ? 'Импорт…' : 'Импорт'}
          </OpenButton>
          <OpenButton
            data-testid="create-activity-btn"
            type="button"
            onClick={() => { setCName(''); setCType('Testnet'); setCTier('prime'); setShowCreate(true); }}
            style={{ background: T.accent, color: '#fff', borderColor: T.accent }}
          >
            + Создать активность
          </OpenButton>
        </FiltersCard>

        {error ? <ErrorText>{error}</ErrorText> : null}

        {loading ? (
          <Loader />
        ) : (
          <TableWrapper>
            <HeaderRow>
              <div>Активность</div>
              <div>Проверка</div>
              <div>Публикация</div>
              <div>Доступ</div>
              <div>Статус</div>
              <div>Каноника</div>
              <div>Обновлено</div>
              <div />
            </HeaderRow>

            {activities.length ? activities.map((activity) => {
              const key = getFomoV2ActivityKey(activity);
              const title = titleOf(activity);
              const logo = logoOf(activity);
              const lifecycle = activity.lifecycleStatus || activity.status;
              return (
                <ActivityRow key={key}>
                  <ProjectCell>
                    <Logo>
                      {logo ? <img src={loader(logo)} alt={title} /> : title.slice(0, 2).toUpperCase()}
                    </Logo>
                    <div>
                      <ProjectTitle title={title}>{title}</ProjectTitle>
                      <ProjectMeta>{activity.symbol || activity.coinSymbol || activity.slug || key}</ProjectMeta>
                    </div>
                  </ProjectCell>
                  <Cell><StatusBadge $tone={toneFor(activity.reviewStatus)}>{displayStatus(activity.reviewStatus)}</StatusBadge></Cell>
                  <Cell><StatusBadge $tone={toneFor(activity.publicationStatus)}>{displayStatus(activity.publicationStatus)}</StatusBadge></Cell>
                  <Cell><StatusBadge $tone={toneFor(activity.accessTier || (activity.nftRequired ? 'prime' : 'public'))}>{displayStatus(activity.accessTier || (activity.nftRequired ? 'prime' : 'public'))}</StatusBadge></Cell>
                  <Cell>{displayStatus(lifecycle)}</Cell>
                  <Cell><StatusBadge $tone={toneFor(activity.canonicalStatus)}>{displayStatus(activity.canonicalStatus)}</StatusBadge></Cell>
                  <Cell>{formatDate(activity.updatedAt)}</Cell>
                  <Cell>
                    <OpenButton
                      type="button"
                      onClick={() => history.push(`/early_land/activities/${encodeURIComponent(key)}`)}
                    >
                      Открыть
                    </OpenButton>
                  </Cell>
                </ActivityRow>
              );
            }) : <EmptyText>Нет активностей по этим фильтрам.</EmptyText>}

            <PaginationWrapper>
              <MutedText>
                {total ? `${offset + 1}–${Math.min(offset + activities.length, total)} из ${total}` : '0 активностей'}
              </MutedText>
              <PaginationButton
                type="button"
                disabled={offset === 0 || loading}
                onClick={() => setOffset((value) => Math.max(0, value - LIMIT))}
              >
                Назад
              </PaginationButton>
              <PaginationButton
                type="button"
                disabled={offset + activities.length >= total || loading}
                onClick={() => setOffset((value) => value + LIMIT)}
              >
                Вперёд
              </PaginationButton>
            </PaginationWrapper>
          </TableWrapper>
        )}

        {showCreate ? (
          <div
            data-testid="create-activity-modal"
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => !creating && setShowCreate(false)}
          >
            <div
              style={{ width: 460, maxWidth: '100%', background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Новая EarlyLand активность</div>
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 18 }}>Создаём черновик — дальше настроите шаги, обзор и опубликуете.</div>

              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Название</label>
              <input
                data-testid="create-activity-name"
                autoFocus
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="Например: zkLink Nova"
                style={{ width: '100%', height: 40, padding: '0 12px', margin: '6px 0 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.soft, color: T.ink, fontSize: 14, outline: 'none' }}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Тип</label>
                  <div style={{ marginTop: 6 }}>
                    <AdminSelect
                      testid="create-activity-type"
                      value={cType}
                      onChange={setCType}
                      options={[
                        { value: 'Testnet', label: 'Testnet' },
                        { value: 'Airdrop', label: 'Airdrop' },
                        { value: 'Farming', label: 'Farming' },
                        { value: 'Quest', label: 'Quest' },
                        { value: 'Staking', label: 'Staking' },
                        { value: 'Other', label: 'Other' },
                      ]}
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Доступ</label>
                  <div style={{ marginTop: 6 }}>
                    <AdminSelect
                      testid="create-activity-tier"
                      value={cTier}
                      onChange={(v) => setCTier(v as 'public' | 'prime')}
                      options={[
                        { value: 'prime', label: 'Prime' },
                        { value: 'public', label: 'Public' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <OpenButton type="button" onClick={() => setShowCreate(false)} disabled={creating}>
                  Отмена
                </OpenButton>
                <OpenButton
                  data-testid="create-activity-submit"
                  type="button"
                  onClick={createNow}
                  disabled={creating}
                  style={{ background: T.accent, color: '#fff', borderColor: T.accent }}
                >
                  {creating ? 'Создание…' : 'Создать и открыть'}
                </OpenButton>
              </div>
            </div>
          </div>
        ) : null}
      </PageWrapper>
    </Shell>
  );
};

export default ActivitiesPage;
