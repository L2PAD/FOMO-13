import { FC, useEffect, useMemo, useState } from 'react';
import {
  fetchFomoV2Activity,
  fetchFomoV2Activities,
  FomoV2AdminActivity,
  getFomoV2ActivityKey,
} from '../../../../services/fomoV2Activities';
import loader from '../../../../services/loader';
import {
  ActivityBadge,
  ActivityLogo,
  ActivityMeta,
  ActivityName,
  ActivityPreview,
  ActivitySelect,
  PickerLabel,
  PickerMessage,
  PickerWrapper,
  SearchInput,
} from './styles';

interface Props {
  value?: string;
  onChange: (activityId: string, activity?: FomoV2AdminActivity) => void;
}

const activityTitle = (activity: FomoV2AdminActivity) =>
  activity.projectName || activity.name || activity.coinName || 'Untitled activity';

const activityLogo = (activity: FomoV2AdminActivity) =>
  activity.projectLogo || activity.logo || '';

const EarlylandActivityPicker: FC<Props> = ({ value = '', onChange }) => {
  const [activities, setActivities] = useState<FomoV2AdminActivity[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => fetchFomoV2Activities({
      search: search.trim() || undefined,
      limit: 100,
      offset: 0,
    })
      .then((response) => {
        if (!active) return;
        setActivities((current) => {
          const selected = current.find(
            (activity) => getFomoV2ActivityKey(activity) === String(value),
          );
          const items = response.items || [];
          return selected && !items.some(
            (activity) => getFomoV2ActivityKey(activity) === String(value),
          ) ? [selected, ...items] : items;
        });
        setError('');
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'Could not load activities');
      })
      .finally(() => active && setLoading(false)), 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, value]);

  useEffect(() => {
    if (!value || activities.some(
      (activity) => getFomoV2ActivityKey(activity) === String(value),
    )) return;

    let active = true;
    fetchFomoV2Activity(String(value))
      .then((activity) => {
        if (!active) return;
        setActivities((current) => current.some(
          (item) => getFomoV2ActivityKey(item) === String(value),
        ) ? current : [activity, ...current]);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [activities, value]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return activities;
    return activities.filter((activity) => [
      activityTitle(activity),
      activity.symbol,
      activity.coinSymbol,
      activity.slug,
      getFomoV2ActivityKey(activity),
    ].filter(Boolean).join(' ').toLowerCase().includes(normalized));
  }, [activities, search]);

  const selected = activities.find(
    (activity) => getFomoV2ActivityKey(activity) === String(value),
  );

  return (
    <PickerWrapper>
      <PickerLabel>Earlyland activity *</PickerLabel>
      <SearchInput
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by project, symbol or activity ID"
      />
      <ActivitySelect
        value={value}
        disabled={loading || Boolean(error)}
        onChange={(event) => {
          const activity = activities.find(
            (item) => getFomoV2ActivityKey(item) === event.target.value,
          );
          onChange(event.target.value, activity);
        }}
      >
        <option value="">Choose an activity</option>
        {filtered.map((activity) => {
          const id = getFomoV2ActivityKey(activity);
          return <option key={id} value={id}>{activityTitle(activity)} · {activity.publicationStatus || 'draft'}</option>;
        })}
      </ActivitySelect>
      {loading ? <PickerMessage>Loading activities…</PickerMessage> : null}
      {error ? <PickerMessage $error>{error}</PickerMessage> : null}
      {selected ? (
        <ActivityPreview>
          <ActivityLogo>
            {activityLogo(selected) ? <img src={loader(activityLogo(selected))} alt="" /> : activityTitle(selected).charAt(0)}
          </ActivityLogo>
          <div>
            <ActivityName>{activityTitle(selected)}</ActivityName>
            <ActivityMeta>
              {selected.lifecycleStatus || 'unknown'} · {selected.publicationStatus || 'draft'} · {getFomoV2ActivityKey(selected)}
            </ActivityMeta>
          </div>
          <ActivityBadge $prime={selected.accessTier === 'prime'}>
            {selected.accessTier || 'public'}
          </ActivityBadge>
        </ActivityPreview>
      ) : null}
    </PickerWrapper>
  );
};

export default EarlylandActivityPicker;
