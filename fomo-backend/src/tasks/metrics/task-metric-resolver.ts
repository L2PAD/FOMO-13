import { Injectable } from '@nestjs/common';
import { BadgeMetricResolver } from '../../badges/metrics/badge-metric-resolver';

export interface TaskMetricValue {
  value: number;
  connected: boolean;
  source: string;
}

export interface TaskMetricCatalogItem {
  key: string;
  label: string;
  unit: string;
  connected: boolean;
  source: string;
}

/**
 * Canonical metric resolver for AUTO_METRIC Core tasks (P2).
 * Reuses the Badge Engine's connectivity truth (missing != 0) and maps a small
 * task-facing metric catalog onto authoritative user fields / providers.
 */
@Injectable()
export class TaskMetricResolver {
  // Kept for parity/future delegation with the Badge Engine connectivity model.
  private readonly badgeResolver = new BadgeMetricResolver();

  private readonly catalog: Record<
    string,
    {
      label: string;
      unit: string;
      connected: boolean;
      source: string;
      read: (user: any, extra: Record<string, number>) => number;
    }
  > = {
    'portfolio.balance': {
      label: 'Баланс публичного портфеля',
      unit: 'USD',
      connected: true,
      source: 'user.portfolioBalance',
      read: (u) => Number(u?.portfolioBalance || 0),
    },
    'referral.qualifiedL1': {
      label: 'Квалифицированные рефералы (L1)',
      unit: 'шт',
      connected: true,
      source: 'user.refLvlOne',
      read: (u) => (Array.isArray(u?.refLvlOne) ? u.refLvlOne.length : 0),
    },
    'trade.completedTrades': {
      label: 'Завершённые OTC/P2P-сделки',
      unit: 'шт',
      connected: true,
      source: 'user.numberOfDeals',
      read: (u) => Number(u?.numberOfDeals || 0),
    },
    'nft.completedDeals': {
      label: 'NFT-сделки',
      unit: 'шт',
      connected: true,
      source: 'user.numberOfDeals',
      read: (u) => Number(u?.numberOfDeals || 0),
    },
    'activity.hoursOnline': {
      label: 'Часов онлайн',
      unit: 'ч',
      connected: true,
      source: 'user.hoursOnline',
      read: (u) => Number(u?.hoursOnline || 0),
    },
    'content.comments': {
      label: 'Комментарии по темам',
      unit: 'шт',
      connected: true,
      source: 'comments collection',
      read: (_u, extra) => Number(extra?.comments || 0),
    },
    // Declared but not yet wired to an authoritative source (connected=false).
    'activity.activeDays': {
      label: 'Активные дни',
      unit: 'дн',
      connected: false,
      source: 'session/activity analytics (не подключено)',
      read: () => 0,
    },
    'content.publishedIdeas': {
      label: 'Опубликованные идеи',
      unit: 'шт',
      connected: false,
      source: 'content/blog (не подключено)',
      read: () => 0,
    },
  };

  getCatalog(): TaskMetricCatalogItem[] {
    return Object.entries(this.catalog).map(([key, m]) => ({
      key,
      label: m.label,
      unit: m.unit,
      connected: m.connected,
      source: m.source,
    }));
  }

  labelOf(metric: string): string {
    return this.catalog[metric]?.label || metric || '';
  }

  isConnected(metric: string): boolean {
    return this.catalog[metric]?.connected === true;
  }

  resolve(
    metric: string,
    user: any,
    extra: Record<string, number> = {},
  ): TaskMetricValue {
    const m = this.catalog[metric];
    if (!m) return { value: 0, connected: false, source: 'unknown' };
    return { value: m.read(user, extra), connected: m.connected, source: m.source };
  }
}
