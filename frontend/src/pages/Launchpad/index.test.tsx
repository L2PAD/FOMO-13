import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  fetchLaunchpadConfig,
  fetchLaunchpadPools,
} from '../../components/services/fomoV2Launchpad';
import { getLaunchpadAdminContext } from '../../features/launchpadV2';
import { cleanupLaunchpadSessionMedia } from './LaunchpadDetailsWizard';
import LaunchpadAdminPage from './index';

jest.mock('../../components/layouts/main_layout/layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../components/services/loader', () => ({
  __esModule: true,
  default: (value: string) => value,
}));

jest.mock('./styles', () => ({
  useStyles: () => new Proxy({}, {
    get: (_target, property) => String(property),
  }),
}));

jest.mock('./LaunchpadDetailsWizard', () => ({
  __esModule: true,
  default: () => null,
  cleanupLaunchpadSessionMedia: jest.fn().mockResolvedValue(undefined),
  LaunchpadAssetField: () => null,
  markLaunchpadMediaPersisted: jest.fn(),
  queueLaunchpadManagedMediaCleanup: jest.fn(),
  retryLaunchpadMediaCleanup: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../components/services/fomoV2Launchpad', () => ({
  fetchLaunchpadConfig: jest.fn(),
  fetchLaunchpadPools: jest.fn(),
}));

jest.mock('../../features/launchpadV2', () => ({
  getLaunchpadAdminContext: jest.fn(),
  launchpadDeployment: {
    chainId: 97,
    contracts: {
      usdt: '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948',
      nft: '0x512C670006456D46679A67456eBe8564810C5609',
      nftMarket: '0x40198F1A090d9893d7822F8804e5317E28C5A776',
      launchpad: '0x0608B52aAC58E7313481d0809E8b4525BDD11d33',
    },
  },
  formatTokenAmount: (value: string) => value,
  getLaunchpadErrorMessage: (error: unknown) => String(error),
}));

describe('Launchpad admin pool economics', () => {
  const usdt = '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948';
  const projectToken = '0x1111111111111111111111111111111111111111';
  const launchpad = '0x0608B52aAC58E7313481d0809E8b4525BDD11d33';

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    (cleanupLaunchpadSessionMedia as jest.Mock).mockResolvedValue(undefined);
    (fetchLaunchpadConfig as jest.Mock).mockResolvedValue({
      chainId: 97,
      chainName: 'BSC Testnet',
      launchpadAddress: launchpad,
      investTokenAddress: usdt,
      investTokenDecimals: 18,
      investTokenSymbol: 'USDT',
      stakingNftAddress: '0x512C670006456D46679A67456eBe8564810C5609',
      nftMarketAddress: '0x40198F1A090d9893d7822F8804e5317E28C5A776',
      rpcConfigured: true,
    });
    (fetchLaunchpadPools as jest.Mock).mockResolvedValue({
      items: [{
        id: 'backend-pool-id',
        canonicalProjectId: 'canonical-project-id',
        canonicalProject: { id: 'canonical-project-id', name: 'Under-target project' },
        chainId: 97,
        launchpadAddress: launchpad,
        poolId: '7',
        status: 'closed',
        publicationStatus: 'published',
        createParams: {
          investToken: usdt,
          targetAmount: '1000000000000000000000',
          greenSeats: '10',
          yellowSeats: '10',
          stakeStart: '1',
          greenStart: '2',
          greenEnd: '3',
          yellowSlotDuration: '60',
          minInvestment: '1000000000000000000',
          feePercent: '5',
        },
        onchainState: {
          raisedAmount: '100000000000000000000',
          closed: true,
          claimEnabled: false,
        },
      }],
      total: 1,
    });
    (getLaunchpadAdminContext as jest.Mock).mockResolvedValue({
      account: '0xD128f1E3b2938eB005Bc5c750A66b82173f62857',
      chainId: 97,
      owner: '0xD128f1E3b2938eB005Bc5c750A66b82173f62857',
      isOwner: true,
      isAdmin: true,
      investmentReceiver: projectToken,
      feeReceiver: projectToken,
      stakingNft: '0x512C670006456D46679A67456eBe8564810C5609',
      launchpadAddress: launchpad,
    });
  });

  it('treats target as a hard cap and derives refund settlement only from the selected token', async () => {
    render(<LaunchpadAdminPage />);

    await screen.findByText('Pool administration');
    const amountInput = screen.getByLabelText(/Human amount/);
    const tokenInput = screen.getByLabelText('Token address');

    expect((amountInput as HTMLInputElement).value).toBe('');
    expect(screen.queryByText(/USDT refund settlement/)).toBeNull();

    fireEvent.change(tokenInput, { target: { value: usdt } });
    expect(await screen.findByText(/USDT refund settlement/)).not.toBeNull();
    expect((amountInput as HTMLInputElement).value).toBe('');

    fireEvent.change(tokenInput, { target: { value: projectToken } });
    await waitFor(() => {
      expect(screen.queryByText(/USDT refund settlement/)).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create launch' }));
    expect(screen.getByText(/targetAmount.*hard cap/)).not.toBeNull();
  });
});
