import { fireEvent, render, waitFor } from '@testing-library/react';
import {
  deleteLaunchpadMedia,
  uploadLaunchpadMedia,
} from '../../components/services/fomoV2Launchpad';
import LaunchpadDetailsWizard, {
  LaunchpadAssetField,
  markLaunchpadMediaPersisted,
  queueLaunchpadManagedMediaCleanup,
  retryLaunchpadMediaCleanup,
} from './LaunchpadDetailsWizard';
import { emptyLaunchpadDetailsForm } from './launchDetailsForm';

jest.mock('../../components/services/fomoV2Launchpad', () => ({
  deleteLaunchpadMedia: jest.fn().mockResolvedValue(undefined),
  uploadLaunchpadMedia: jest.fn(),
}));

jest.mock('../../components/services/loader', () => ({
  __esModule: true,
  default: (value: string) => value,
}));

describe('Launchpad managed media cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'blob:preview');
    URL.revokeObjectURL = jest.fn();
  });

  it('retains the managed key after save and queues deletion when a parent row is removed', async () => {
    const asset = {
      url: '/uploads/launchpad/2026/07/test.webp',
      key: 'launchpad/2026/07/test.webp',
      mimeType: 'image/webp',
      size: 4,
      managed: true,
    };
    (uploadLaunchpadMedia as jest.Mock).mockResolvedValue(asset);
    const onChange = jest.fn();
    const { container } = render(
      <LaunchpadAssetField label="Gallery" value="" onChange={onChange} />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['test'], 'test.webp', { type: 'image/webp' })] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(asset.url));
    markLaunchpadMediaPersisted([asset.url]);
    queueLaunchpadManagedMediaCleanup([asset.url]);

    await waitFor(() => expect(deleteLaunchpadMedia).toHaveBeenCalledWith(asset.key, { keepalive: false }));
  });

  it('keeps a failed managed-media deletion queued and retries the same key', async () => {
    const asset = {
      url: '/uploads/launchpad/2026/07/retry.webp',
      key: 'launchpad/2026/07/retry.webp',
      mimeType: 'image/webp',
      size: 5,
      managed: true,
    };
    (uploadLaunchpadMedia as jest.Mock).mockResolvedValue(asset);
    (deleteLaunchpadMedia as jest.Mock)
      .mockRejectedValueOnce(new Error('Asset is still referenced'))
      .mockResolvedValueOnce(undefined);
    const onChange = jest.fn();
    const { container } = render(
      <LaunchpadAssetField label="Gallery" value="" onChange={onChange} />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['retry'], 'retry.webp', { type: 'image/webp' })] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(asset.url));
    markLaunchpadMediaPersisted([asset.url]);
    queueLaunchpadManagedMediaCleanup([asset.url]);
    await waitFor(() => expect(deleteLaunchpadMedia).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));

    await retryLaunchpadMediaCleanup();

    expect(deleteLaunchpadMedia).toHaveBeenCalledTimes(2);
    expect(deleteLaunchpadMedia).toHaveBeenLastCalledWith(asset.key, { keepalive: false });
  });

  it('never sends unmanaged external URLs to the media delete endpoint', async () => {
    queueLaunchpadManagedMediaCleanup([
      'https://external.example.test/not-owned.webp',
      '',
    ]);
    await retryLaunchpadMediaCleanup();

    expect(deleteLaunchpadMedia).not.toHaveBeenCalled();
  });

  it('disables all editable wizard controls while create is in flight', () => {
    const { getByPlaceholderText } = render(
      <LaunchpadDetailsWizard
        mode="create"
        value={{ ...emptyLaunchpadDetailsForm(), slug: 'locked-launch' }}
        onChange={jest.fn()}
        poolStep={<div>Pool fields</div>}
        primaryLabel="Create"
        formDisabled
        onPrimaryAction={jest.fn()}
      />,
    );

    const input = getByPlaceholderText('project-token-sale');
    expect((input.closest('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
  });
});
