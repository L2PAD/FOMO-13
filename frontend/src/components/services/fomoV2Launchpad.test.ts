import getAccessToken from '../utils/getAccessToken';
import {
  confirmLaunchpadPoolCreateCancellation,
  deleteLaunchpadMedia,
  deleteLaunchpadPlacement,
  fetchLaunchpadPlacements,
  fetchLaunchpadProjects,
  fetchLaunchpadReadiness,
  resetLaunchpadRevertedCreate,
  syncLaunchpadPoolContract,
  updateLaunchpadPlacement,
  updateLaunchpadDetails,
  uploadLaunchpadMedia,
  upsertLaunchpadPlacement,
} from './fomoV2Launchpad';

jest.mock('../utils/getAccessToken', () => ({
  __esModule: true,
  default: jest.fn(() => 'admin-token'),
}));

jest.mock('./config', () => ({
  configureUrl: (path: string) => `https://api.example.test/api/${path}`,
}));

const response = (body: unknown, status = 200): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
} as unknown as Response);

describe('fomo-v2 Launchpad placement admin API', () => {
  const poolId = '507f1f77bcf86cd799439011';
  const placementId = '507f191e810c19729de860ea';

  beforeEach(() => {
    jest.clearAllMocks();
    (getAccessToken as jest.Mock).mockReturnValue('admin-token');
    global.fetch = jest.fn();
  });

  it('lists placements using the backend poolId query without creating a placement', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({
      items: [{
        id: placementId,
        launchpadPoolId: poolId,
        surface: 'launchpad',
        enabled: false,
        featured: true,
        ad: false,
        sortOrder: 7,
        banner: { desktopUrl: '/banners/launch.webp' },
      }],
      total: 1,
      limit: 10,
      offset: 0,
    }));

    const result = await fetchLaunchpadPlacements({
      surface: 'launchpad',
      poolId,
      enabled: false,
      limit: 10,
      offset: 0,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      `https://api.example.test/api/admin/fomo-v2/launchpad/placements?surface=launchpad&poolId=${poolId}&enabled=false&limit=10&offset=0`,
    );
    expect(init).not.toHaveProperty('method');
    expect(result.items[0]).toMatchObject({
      id: placementId,
      launchpadPoolId: poolId,
      surface: 'launchpad',
      enabled: false,
      featured: true,
      sortOrder: 7,
    });
  });

  it('upserts only the explicitly selected pool and surface', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({
      placement: {
        id: placementId,
        launchpadPoolId: poolId,
        surface: 'crypto_projects',
        enabled: true,
        featured: false,
        ad: true,
        sortOrder: 2,
        banner: { desktopUrl: '/banners/projects.webp' },
      },
    }));

    await upsertLaunchpadPlacement({
      launchpadPoolId: poolId,
      surface: 'crypto_projects',
      enabled: true,
      featured: false,
      ad: true,
      sortOrder: 2,
      banner: { desktopUrl: '/banners/projects.webp' },
    });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.example.test/api/admin/fomo-v2/launchpad/placements');
    expect(init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(init.body)).toEqual({
      launchpadPoolId: poolId,
      surface: 'crypto_projects',
      enabled: true,
      featured: false,
      ad: true,
      sortOrder: 2,
      banner: { desktopUrl: '/banners/projects.webp' },
    });
  });

  it('patches and deletes by placement id with the backend response wrapper', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({
        data: {
          placement: {
            id: placementId,
            launchpadPoolId: poolId,
            surface: 'launchpad',
            enabled: true,
            featured: true,
            ad: true,
            sortOrder: 1,
            banner: { desktopUrl: '/banners/updated.webp' },
          },
        },
      }))
      .mockResolvedValueOnce(response({ deleted: true, id: placementId }));

    const updated = await updateLaunchpadPlacement(placementId, {
      featured: true,
      ad: true,
      banner: { desktopUrl: '/banners/updated.webp' },
    });
    await deleteLaunchpadPlacement(placementId);

    expect(updated).toMatchObject({ id: placementId, featured: true, ad: true });
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/admin/fomo-v2/launchpad/placements/${placementId}`,
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/admin/fomo-v2/launchpad/placements/${placementId}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });

  it('uploads media as authenticated multipart without overriding the browser boundary', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({
      data: {
        asset: {
          url: 'https://cdn.example.test/launch/banner.webp',
          key: 'launch/banner.webp',
          mimeType: 'image/webp',
          size: 4,
          managed: true,
        },
      },
    }));
    const file = new File(['test'], 'banner.webp', { type: 'image/webp' });

    const asset = await uploadLaunchpadMedia(file);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.example.test/api/admin/fomo-v2/launchpad/media');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBe(file);
    expect(init.headers).toEqual({ Authorization: 'Bearer admin-token' });
    expect(asset).toMatchObject({
      url: 'https://cdn.example.test/launch/banner.webp',
      key: 'launch/banner.webp',
      mimeType: 'image/webp',
    });
  });

  it('normalizes asset-wrapped and plain media responses', async () => {
    const wrapped = {
      url: '/uploads/wrapped.webp',
      key: 'wrapped.webp',
      mimeType: 'image/webp',
      size: 7,
    };
    const plain = {
      url: '/uploads/plain.png',
      key: 'plain.png',
      mimeType: 'image/png',
      size: 9,
    };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({ asset: wrapped }))
      .mockResolvedValueOnce(response(plain));

    await expect(uploadLaunchpadMedia(new File(['a'], 'a.webp', { type: 'image/webp' })))
      .resolves.toEqual(wrapped);
    await expect(uploadLaunchpadMedia(new File(['b'], 'b.png', { type: 'image/png' })))
      .resolves.toEqual(plain);
  });

  it('patches launch details with optimistic revision and deletes managed media by key', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({
        pool: {
          id: poolId,
          canonicalProjectId: '507f1f77bcf86cd799439012',
          chainId: 97,
          launchpadAddress: '0x0608B52aAC58E7313481d0809E8b4525BDD11d33',
          status: 'active',
          revision: 3,
          slug: 'quantum-chain-sale',
        },
        readiness: {
          ready: false,
          issues: [{ code: 'missing_banner', message: 'A banner is required.' }],
        },
      }))
      .mockResolvedValueOnce(response(undefined, 204));

    const saved = await updateLaunchpadDetails(poolId, {
      expectedRevision: 2,
      slug: 'quantum-chain-sale',
      launchDetails: {
        title: 'Quantum Chain Sale',
        bannerUrl: '/uploads/banner.webp',
      },
    });
    await deleteLaunchpadMedia('launch/banner.webp');

    expect(saved.readiness).toMatchObject({ ready: false });

    const [, patchInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(patchInit.body)).toEqual({
      expectedRevision: 2,
      slug: 'quantum-chain-sale',
      launchDetails: {
        title: 'Quantum Chain Sale',
        bannerUrl: '/uploads/banner.webp',
      },
    });
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/api/admin/fomo-v2/launchpad/media',
      expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ key: 'launch/banner.webp' }) }),
    );
  });

  it('loads authoritative publication readiness from its dedicated endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({
      ready: true,
      issues: [],
      checks: { content: true, contract: true, pool: true, token: true },
    }));

    await expect(fetchLaunchpadReadiness(poolId)).resolves.toMatchObject({ ready: true });
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.example.test/api/admin/fomo-v2/launchpad/pools/${poolId}/readiness`,
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('uses dedicated backend-proof endpoints for contract sync, cancellation and reset', async () => {
    const replacementTxHash = `0x${'2'.repeat(64)}`;
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({
        pool: {
          id: poolId,
          canonicalProjectId: '507f1f77bcf86cd799439012',
          chainId: 97,
          launchpadAddress: '0x0608B52aAC58E7313481d0809E8b4525BDD11d33',
          status: 'closed',
          onchainState: { closed: true, claimEnabled: false },
        },
      }))
      .mockResolvedValueOnce(response({
        pool: {
          id: poolId,
          canonicalProjectId: '507f1f77bcf86cd799439012',
          chainId: 97,
          launchpadAddress: '0x0608B52aAC58E7313481d0809E8b4525BDD11d33',
          status: 'failed',
        },
        verification: { status: 'failed', failureKind: 'cancelled', safeToRetry: true },
      }))
      .mockResolvedValueOnce(response({ reset: true }));

    await expect(syncLaunchpadPoolContract(poolId)).resolves.toMatchObject({
      status: 'closed',
      onchainState: { closed: true, claimEnabled: false },
    });
    await expect(confirmLaunchpadPoolCreateCancellation(poolId, { replacementTxHash }))
      .resolves.toMatchObject({
        verification: { failureKind: 'cancelled', safeToRetry: true },
      });
    await expect(resetLaunchpadRevertedCreate(poolId)).resolves.toEqual({ reset: true });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/admin/fomo-v2/launchpad/pools/${poolId}/sync-contract`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/admin/fomo-v2/launchpad/pools/${poolId}/confirm-create-cancellation`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ replacementTxHash }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/admin/fomo-v2/launchpad/pools/${poolId}/reset-reverted-create`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('keeps a rejected backend reset as a failed operation', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({
      message: 'Create attempt is not explicitly safe to retry.',
    }, 409));

    await expect(resetLaunchpadRevertedCreate(poolId))
      .rejects.toThrow('Create attempt is not explicitly safe to retry.');
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.example.test/api/admin/fomo-v2/launchpad/pools/${poolId}/reset-reverted-create`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('normalizes the backend canonical description for launch fallback previews', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({
      items: [{ id: 'canonical-1', name: 'Canonical', description: 'Shared description' }],
      total: 1,
    }));

    const result = await fetchLaunchpadProjects();

    expect(result.items[0]).toMatchObject({
      id: 'canonical-1',
      name: 'Canonical',
      descriptionText: 'Shared description',
    });
  });
});
