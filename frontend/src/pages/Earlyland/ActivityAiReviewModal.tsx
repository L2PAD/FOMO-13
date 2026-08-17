import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FomoV2ActivityAiProposal } from '../../components/services/fomoV2Activities';
import { ActivityAiReviewGroup, ActivityAiReviewItem } from './activityAiReview';
import {
  ActionButton,
  AiAssistantIcon,
  AiChangeCheckbox,
  AiChangeInfo,
  AiChangePath,
  AiChangeReason,
  AiChangeRow,
  AiCompareArrow,
  AiCompareHeader,
  AiCompareHeaderLabel,
  AiEmptyState,
  AiGroupTitle,
  AiModalClose,
  AiModalDialog,
  AiModalFooter,
  AiModalFooterActions,
  AiModalHeader,
  AiModalHeading,
  AiModalMeta,
  AiModalOverlay,
  AiModalScroll,
  AiModalSubtitle,
  AiModalTitle,
  AiModalToolbar,
  AiModalToolbarGroup,
  AiRejectPanel,
  AiBlockingNotice,
  AiNoticeBar,
  AiNoticeGroup,
  AiNoticeItem,
  AiNoticeLabel,
  AiNoticeTrack,
  AiNoticeViewport,
  AiToolbarButton,
  AiValue,
  AiValueCard,
  AiValueLabel,
  ProjectMeta,
  StatusBadge,
  Textarea,
} from './ActivitiesStyles';

interface ActivityAiReviewModalProps {
  activityName: string;
  proposal: FomoV2ActivityAiProposal;
  items: ActivityAiReviewItem[];
  selectedPaths: string[];
  busy: boolean;
  hasUnsavedChanges: boolean;
  onSelectionChange: (paths: string[]) => void;
  onApply: () => void;
  onReject: (reason?: string) => void;
  onClose: () => void;
}

const GROUP_ORDER: ActivityAiReviewGroup[] = [
  'Overview',
  'Content',
  'Task guide',
  'FOMO review',
  'Metrics & flags',
  'Links & data',
];

const GROUP_LABEL: Record<string, string> = {
  'Overview': 'Основное',
  'Content': 'Контент',
  'Task guide': 'Гайд по заданию',
  'FOMO review': 'FOMO Review',
  'Metrics & flags': 'Метрики и флаги',
  'Links & data': 'Ссылки и данные',
};

const valueText = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch (error) { return String(value); }
};

const unique = (paths: string[]): string[] => Array.from(new Set(paths));

const ActivityAiReviewModal = ({
  activityName,
  proposal,
  items,
  selectedPaths,
  busy,
  hasUnsavedChanges,
  onSelectionChange,
  onApply,
  onReject,
  onClose,
}: ActivityAiReviewModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const changedItems = useMemo(() => items.filter((item) => !item.unchanged), [items]);
  const unchangedCount = items.length - changedItems.length;
  const selectedItemCount = items.filter((item) => (
    item.paths.every((path) => selectedPaths.includes(path))
  )).length;
  const visibleItems = showUnchanged ? items : changedItems;
  const groupedItems = GROUP_ORDER.map((group) => ({
    group,
    items: visibleItems.filter((item) => item.group === group),
  })).filter((entry) => entry.items.length);
  const canApply = proposal.status === 'proposed'
    && selectedPaths.length > 0
    && !busy
    && !hasUnsavedChanges;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('hidden'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [busy, onClose]);

  const toggleItem = (item: ActivityAiReviewItem, checked: boolean) => {
    if (checked) onSelectionChange(unique([...selectedPaths, ...item.paths]));
    else onSelectionChange(selectedPaths.filter((path) => !item.paths.includes(path)));
  };

  const selectSafeChanges = () => {
    onSelectionChange(unique(items
      .filter((item) => !item.unchanged && !item.destructive)
      .flatMap((item) => item.paths)));
  };

  const generatedAt = proposal.generatedAt
    ? new Date(proposal.generatedAt).toLocaleString('ru-RU')
    : 'Время генерации недоступно';
  const proposalNotices = [
    ...(proposal.summary ? [{ text: proposal.summary, summary: true }] : []),
    ...(proposal.warnings || []).map((warning) => ({ text: warning, summary: false })),
  ];

  const renderProposalNotices = (duplicate = false) => (
    <AiNoticeGroup $duplicate={duplicate} aria-hidden={duplicate || undefined}>
      {proposalNotices.map((notice, index) => (
        <AiNoticeItem
          key={`${duplicate ? 'duplicate' : 'notice'}-${index}-${notice.text}`}
          $summary={notice.summary}
          title={notice.text}
        >
          {notice.summary ? 'Сводка AI ·' : '⚠'} {notice.text}
        </AiNoticeItem>
      ))}
    </AiNoticeGroup>
  );

  return createPortal(
    <AiModalOverlay
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <AiModalDialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-ai-review-title"
        tabIndex={-1}
      >
        <AiModalHeader>
          <AiModalHeading>
            <AiAssistantIcon aria-hidden="true">AI</AiAssistantIcon>
            <div>
              <AiModalTitle id="activity-ai-review-title">Проверка AI-предложения</AiModalTitle>
              <AiModalSubtitle>
                Сравните сохранённую версию «{activityName}» с AI-предложением. Отметьте только те поля, которые хотите перенести в черновик.
              </AiModalSubtitle>
              <AiModalMeta>
                <StatusBadge $tone={proposal.status === 'proposed' ? 'blue' : 'gray'}>{proposal.status || 'неизвестно'}</StatusBadge>
                <StatusBadge $tone="gray">{proposal.model || 'Модель недоступна'}</StatusBadge>
                <StatusBadge $tone="gray">{generatedAt}</StatusBadge>
                <StatusBadge $tone="green">изменено: {changedItems.length}</StatusBadge>
                {unchangedCount ? <StatusBadge $tone="gray">без изменений: {unchangedCount}</StatusBadge> : null}
              </AiModalMeta>
            </div>
          </AiModalHeading>
          <AiModalClose type="button" aria-label="Закрыть AI-обзор" onClick={onClose} disabled={busy}>×</AiModalClose>
        </AiModalHeader>

        <AiModalToolbar>
          <AiModalToolbarGroup>
            <AiToolbarButton type="button" $active onClick={selectSafeChanges}>Выбрать безопасные изменения</AiToolbarButton>
            <AiToolbarButton type="button" onClick={() => onSelectionChange([])}>Снять выбор</AiToolbarButton>
            {unchangedCount ? (
              <AiToolbarButton
                type="button"
                $active={showUnchanged}
                onClick={() => setShowUnchanged((current) => !current)}
              >
                {showUnchanged ? 'Скрыть' : 'Показать'} без изменений ({unchangedCount})
              </AiToolbarButton>
            ) : null}
          </AiModalToolbarGroup>
          <ProjectMeta>Выбрано полей: {selectedItemCount} из {items.length}</ProjectMeta>
        </AiModalToolbar>

        {proposalNotices.length ? (
          <AiNoticeBar role="status" aria-label="Сводка и предупреждения AI">
            <AiNoticeLabel>Заметки AI · {proposalNotices.length}</AiNoticeLabel>
            <AiNoticeViewport tabIndex={0} aria-label="Наведите или прокрутите, чтобы прочитать заметки AI">
              <AiNoticeTrack>
                {renderProposalNotices()}
                {renderProposalNotices(true)}
              </AiNoticeTrack>
            </AiNoticeViewport>
          </AiNoticeBar>
        ) : null}
        {hasUnsavedChanges ? (
          <AiBlockingNotice>
            Сначала сохраните или отмените ручные правки, затем применяйте или отклоняйте это предложение — чтобы сравнение оставалось корректным.
          </AiBlockingNotice>
        ) : null}

        <AiModalScroll>
          <AiCompareHeader aria-hidden="true">
            <AiCompareHeaderLabel>Поле</AiCompareHeaderLabel>
            <AiCompareHeaderLabel $tone="before">До · текущее сохранённое</AiCompareHeaderLabel>
            <span />
            <AiCompareHeaderLabel $tone="after">После · AI-предложение</AiCompareHeaderLabel>
          </AiCompareHeader>

          {groupedItems.length ? groupedItems.map((entry) => (
            <div key={entry.group}>
              <AiGroupTitle>{GROUP_LABEL[entry.group] || entry.group}</AiGroupTitle>
              {entry.items.map((item) => {
                const checked = item.paths.every((path) => selectedPaths.includes(path));
                return (
                  <AiChangeRow key={item.id} $selected={checked}>
                    <AiChangeInfo>
                      <AiChangeCheckbox
                        type="checkbox"
                        aria-label={`Применить ${item.label}`}
                        checked={checked}
                        disabled={item.unchanged || proposal.status !== 'proposed' || busy}
                        onChange={(event) => toggleItem(item, event.target.checked)}
                      />
                      <div>
                        <AiChangePath>{item.label}</AiChangePath>
                        <AiChangeReason>{item.paths.join(' + ')}</AiChangeReason>
                        {item.reason ? <AiChangeReason>{item.reason}</AiChangeReason> : null}
                        {item.destructive ? <StatusBadge $tone="red">Очищает существующие данные</StatusBadge> : null}
                        {item.unchanged ? <StatusBadge $tone="gray">Без изменений</StatusBadge> : null}
                        {item.confidence !== undefined ? <StatusBadge $tone="blue">уверенность {item.confidence}%</StatusBadge> : null}
                      </div>
                    </AiChangeInfo>
                    <AiValueCard $tone="before">
                      <AiValueLabel $tone="before">До · текущее сохранённое</AiValueLabel>
                      <AiValue>{valueText(item.before)}</AiValue>
                    </AiValueCard>
                    <AiCompareArrow aria-hidden="true">→</AiCompareArrow>
                    <AiValueCard $tone="after">
                      <AiValueLabel $tone="after">После · AI-предложение</AiValueLabel>
                      <AiValue>{valueText(item.after)}</AiValue>
                    </AiValueCard>
                  </AiChangeRow>
                );
              })}
            </div>
          )) : (
            <AiEmptyState>Это предложение не содержит изменений на уровне полей.</AiEmptyState>
          )}
        </AiModalScroll>

        <AiModalFooter>
          {isRejecting ? (
            <AiRejectPanel>
              <Textarea
                aria-label="Причина отклонения AI-предложения"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Почему это предложение не подходит? (необязательно)"
                autoFocus
              />
              <ActionButton type="button" $tone="neutral" disabled={busy} onClick={() => setIsRejecting(false)}>Отмена</ActionButton>
              <ActionButton type="button" $tone="danger" disabled={busy} onClick={() => onReject(rejectionReason.trim() || undefined)}>
                {busy ? 'Отклонение…' : 'Подтвердить отклонение'}
              </ActionButton>
            </AiRejectPanel>
          ) : (
            <>
              <div>
                <ProjectMeta>Выбрано путей: {selectedPaths.length}</ProjectMeta>
                <ProjectMeta>Применение обновляет только черновик. Оно не одобряет и не публикует активность.</ProjectMeta>
              </div>
              <AiModalFooterActions>
                <ActionButton type="button" $tone="neutral" disabled={busy} onClick={onClose}>Закрыть</ActionButton>
                <ActionButton type="button" $tone="danger" disabled={busy || hasUnsavedChanges || proposal.status !== 'proposed'} onClick={() => setIsRejecting(true)}>Отклонить предложение</ActionButton>
                <ActionButton type="button" disabled={!canApply} onClick={onApply}>
                  {busy ? 'Применение…' : `Применить выбранное (${selectedItemCount})`}
                </ActionButton>
              </AiModalFooterActions>
            </>
          )}
        </AiModalFooter>
      </AiModalDialog>
    </AiModalOverlay>,
    document.body,
  );
};

export default ActivityAiReviewModal;
