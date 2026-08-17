import {
  ChangeEvent,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { toast } from 'react-toastify';
import {
  deleteLaunchpadMedia,
  LaunchpadCanonicalProject,
  LaunchpadMediaAsset,
  LaunchpadReadiness,
  uploadLaunchpadMedia,
} from '../../components/services/fomoV2Launchpad';
import loader from '../../components/services/loader';
import {
  ALLOWED_LAUNCHPAD_IMAGE_TYPES,
  LAUNCHPAD_DETAILS_LIMITS,
  LaunchpadDetailsForm,
  launchpadReadinessMessages,
  resolveLaunchpadIdentity,
  slugifyLaunchpad,
  validateLaunchpadDetails,
  validateLaunchpadDetailsStep,
  validateLaunchpadImage,
} from './launchDetailsForm';
import { useLaunchpadWizardStyles } from './wizardStyles';

const STEPS = [
  ['Project & identity', 'Canonical fallback and launch identity'],
  ['Launch content', 'Public project story and token utility'],
  ['Media', 'Launch detail media; page-placement banners stay separate'],
  ['Pool & schedule', 'Exact on-chain values and browser-local dates'],
  ['Rules & FAQ', 'Participation explanations and support content'],
  ['Links', 'Launch-specific overrides for canonical links'],
  ['Preview', 'Resolved data, readiness and final action'],
] as const;

// Keeps upload keys available while wizard steps unmount/remount. The form
// stores only public URLs; keys are retained in-memory solely for safe cleanup
// of files uploaded during the current admin session.
const managedAssetsByUrl = new Map<string, LaunchpadMediaAsset>();
const persistedManagedAssetsByUrl = new Map<string, LaunchpadMediaAsset>();
const pendingManagedAssetCleanup = new Map<string, LaunchpadMediaAsset>();
const managedAssetCleanupInFlight = new Map<string, Promise<void>>();

const findManagedAsset = (url: string): LaunchpadMediaAsset | undefined => (
  managedAssetsByUrl.get(url) || persistedManagedAssetsByUrl.get(url)
);

/** Marks URLs saved by a successful backend mutation as no longer orphaned. */
export const markLaunchpadMediaPersisted = (urls: string[]): void => {
  urls.forEach((url) => {
    const asset = managedAssetsByUrl.get(url);
    if (!asset) return;
    managedAssetsByUrl.delete(url);
    persistedManagedAssetsByUrl.set(url, asset);
  });
};

const deleteManagedAsset = (
  asset: LaunchpadMediaAsset,
  keepalive = false,
): Promise<void> => {
  pendingManagedAssetCleanup.set(asset.key, asset);
  const current = managedAssetCleanupInFlight.get(asset.key);
  if (current) return current;
  const request = (async () => {
    try {
      await deleteLaunchpadMedia(asset.key, { keepalive });
      pendingManagedAssetCleanup.delete(asset.key);
    } finally {
      managedAssetCleanupInFlight.delete(asset.key);
    }
  })();
  managedAssetCleanupInFlight.set(asset.key, request);
  return request;
};

const scheduleManagedAssetCleanup = (asset: LaunchpadMediaAsset): void => {
  deleteManagedAsset(asset).catch(() => undefined);
};

/** Queue files whose form/placement references are being removed. */
export const queueLaunchpadManagedMediaCleanup = (urls: string[]): void => {
  urls.map((url) => url.trim()).filter(Boolean).forEach((url) => {
    const asset = findManagedAsset(url);
    if (!asset) return;
    managedAssetsByUrl.delete(url);
    persistedManagedAssetsByUrl.delete(url);
    scheduleManagedAssetCleanup(asset);
  });
};

/** Retries assets that could not be deleted until their DB reference changed. */
export const retryLaunchpadMediaCleanup = async (): Promise<void> => {
  await Promise.all(Array.from(pendingManagedAssetCleanup.values()).map(async (asset) => {
    try {
      await deleteManagedAsset(asset);
    } catch {
      // Keep the key queued; a different launch or placement may still reference it.
    }
  }));
};

/** Best-effort cleanup for uploads abandoned by leaving the admin page. */
export const cleanupLaunchpadSessionMedia = async (
  options: { keepalive?: boolean } = {},
): Promise<void> => {
  const assets = new Map<string, LaunchpadMediaAsset>();
  managedAssetsByUrl.forEach((asset) => assets.set(asset.key, asset));
  pendingManagedAssetCleanup.forEach((asset) => assets.set(asset.key, asset));
  managedAssetsByUrl.clear();
  persistedManagedAssetsByUrl.clear();
  await Promise.all(Array.from(assets.values()).map(async (asset) => {
    try {
      await deleteManagedAsset(asset, options.keepalive === true);
    } catch {
      // Referenced/saved assets are intentionally protected by the backend.
    }
  }));
};

interface AssetFieldProps {
  label: string;
  value: string;
  inheritedValue?: string;
  inheritedLabel?: string;
  onChange: (value: string) => void;
}

export const LaunchpadAssetField = ({
  label,
  value,
  inheritedValue,
  inheritedLabel,
  onChange,
}: AssetFieldProps) => {
  const classes = useLaunchpadWizardStyles();
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState('');
  const [uploadedAsset, setUploadedAsset] = useState<LaunchpadMediaAsset | null>(() => (
    findManagedAsset(value) || null
  ));
  const resolvedPreview = localPreview || value || inheritedValue || '';

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const validationError = validateLaunchpadImage(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return preview;
    });
    setUploading(true);
    try {
      const previousUploadedAsset = uploadedAsset?.url === value
        ? uploadedAsset
        : findManagedAsset(value);
      const asset = await uploadLaunchpadMedia(file);
      managedAssetsByUrl.set(asset.url, asset);
      persistedManagedAssetsByUrl.delete(asset.url);
      onChange(asset.url);
      setUploadedAsset(asset);
      if (previousUploadedAsset && previousUploadedAsset.url !== asset.url) {
        managedAssetsByUrl.delete(previousUploadedAsset.url);
        persistedManagedAssetsByUrl.delete(previousUploadedAsset.url);
        scheduleManagedAssetCleanup(previousUploadedAsset);
      }
      toast.success(`${label} uploaded`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : `${label} upload failed`);
    } finally {
      setUploading(false);
      setLocalPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return '';
      });
    }
  };

  const remove = async () => {
    const currentUploadedAsset = uploadedAsset?.url === value
      ? uploadedAsset
      : findManagedAsset(value) || null;
    onChange('');
    setUploadedAsset(null);
    if (!currentUploadedAsset) return;
    managedAssetsByUrl.delete(currentUploadedAsset.url);
    persistedManagedAssetsByUrl.delete(currentUploadedAsset.url);
    try {
      await deleteManagedAsset(currentUploadedAsset);
    } catch (error: unknown) {
      toast.warning(error instanceof Error
        ? `Reference removed; file cleanup is queued until save: ${error.message}`
        : 'Reference removed; file cleanup is queued until save');
    }
  };

  const changeUrl = (nextValue: string) => {
    const previousUploadedAsset = uploadedAsset?.url === value
      ? uploadedAsset
      : findManagedAsset(value);
    onChange(nextValue);
    if (previousUploadedAsset && previousUploadedAsset.url !== nextValue) {
      setUploadedAsset(null);
      managedAssetsByUrl.delete(previousUploadedAsset.url);
      persistedManagedAssetsByUrl.delete(previousUploadedAsset.url);
      scheduleManagedAssetCleanup(previousUploadedAsset);
    }
  };

  return (
    <div className={classes.assetGrid}>
      <div className={classes.assetPreview}>
        {resolvedPreview
          ? <img className={classes.assetImage} src={loader(resolvedPreview)} alt={`${label} preview`} />
          : 'No image selected'}
      </div>
      <div>
        <label className={classes.field}>
          <span className={classes.label}>{label} URL</span>
          <input
            className={classes.input}
            value={value}
            onChange={(event) => changeUrl(event.target.value)}
            maxLength={LAUNCHPAD_DETAILS_LIMITS.url}
            placeholder={inheritedValue ? 'Empty uses canonical project media' : 'https://… or upload a file'}
          />
          {inheritedValue && !value && (
            <span className={classes.helper}>{inheritedLabel || 'Inherited from canonical project'}</span>
          )}
        </label>
        <div className={classes.assetActions}>
          <label className={classes.button} htmlFor={inputId}>
            {uploading ? 'Uploading…' : value ? 'Replace with file' : 'Upload file'}
          </label>
          <input
            id={inputId}
            className={classes.hiddenFile}
            type="file"
            accept={ALLOWED_LAUNCHPAD_IMAGE_TYPES.join(',')}
            disabled={uploading}
            onChange={chooseFile}
          />
          {value && (
            <button
              className={`${classes.button} ${classes.dangerButton}`}
              type="button"
              disabled={uploading}
              onClick={remove}
            >Remove override</button>
          )}
        </div>
        <div className={classes.helper}>JPG, PNG, WEBP or GIF · maximum 10 MB. Files are stored before their URL is saved.</div>
      </div>
    </div>
  );
};

interface LaunchpadDetailsWizardProps {
  mode: 'create' | 'edit';
  value: LaunchpadDetailsForm;
  onChange: (value: LaunchpadDetailsForm) => void;
  canonicalProject?: LaunchpadCanonicalProject;
  projectPicker?: ReactNode;
  poolStep: ReactNode;
  poolPreview?: ReactNode;
  readiness?: LaunchpadReadiness;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryBusy?: boolean;
  formDisabled?: boolean;
  validatePoolStep?: () => string[];
  onPrimaryAction: () => void | Promise<void>;
}

const LaunchpadDetailsWizard = ({
  mode,
  value,
  onChange,
  canonicalProject,
  projectPicker,
  poolStep,
  poolPreview,
  readiness,
  primaryLabel,
  primaryDisabled = false,
  primaryBusy = false,
  formDisabled = false,
  validatePoolStep,
  onPrimaryAction,
}: LaunchpadDetailsWizardProps) => {
  const classes = useLaunchpadWizardStyles();
  const [activeStep, setActiveStep] = useState(1);
  const identity = useMemo(
    () => resolveLaunchpadIdentity(value, canonicalProject),
    [canonicalProject, value],
  );
  const clientIssues = useMemo(
    () => validateLaunchpadDetails(value, canonicalProject),
    [canonicalProject, value],
  );
  const backendIssues = launchpadReadinessMessages(readiness);

  const patch = (next: Partial<LaunchpadDetailsForm>) => onChange({ ...value, ...next });
  const setString = (key: keyof LaunchpadDetailsForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => patch({ [key]: event.target.value });

  const goNext = () => {
    const issues = activeStep === 4
      ? validatePoolStep?.() || []
      : validateLaunchpadDetailsStep(activeStep, value, canonicalProject);
    if (issues.length) {
      toast.error(issues[0]);
      return;
    }
    setActiveStep((current) => Math.min(STEPS.length, current + 1));
  };

  const submit = async () => {
    const poolIssues = validatePoolStep?.() || [];
    const issues = [...clientIssues, ...poolIssues];
    if (issues.length) {
      toast.error(issues[0]);
      return;
    }
    await onPrimaryAction();
  };

  const updateRule = (index: number, rule: string) => patch({
    participationRules: value.participationRules.map((item, itemIndex) => (
      itemIndex === index ? rule : item
    )),
  });

  const updateFaq = (index: number, key: 'question' | 'answer', nextValue: string) => patch({
    faq: value.faq.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: nextValue } : item
    )),
  });

  const updateInvestor = (
    index: number,
    key: 'name' | 'logoUrl' | 'website',
    nextValue: string,
  ) => patch({
    investors: value.investors.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: nextValue } : item
    )),
  });

  const updateTeamMember = (
    index: number,
    key: 'name' | 'role' | 'avatarUrl' | 'website',
    nextValue: string,
  ) => patch({
    team: value.team.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: nextValue } : item
    )),
  });

  const updateDocument = (
    index: number,
    key: 'title' | 'url' | 'type',
    nextValue: string,
  ) => patch({
    documents: value.documents.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: nextValue } : item
    )),
  });

  const updateFlag = (
    key: 'greenFlags' | 'yellowFlags' | 'redFlags',
    index: number,
    nextValue: string,
  ) => patch({
    [key]: value[key].map((item, itemIndex) => (itemIndex === index ? nextValue : item)),
  });

  const moveGallery = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.gallery.length) return;
    const gallery = [...value.gallery];
    [gallery[index], gallery[nextIndex]] = [gallery[nextIndex], gallery[index]];
    patch({ gallery });
  };

  const renderFlagEditor = (
    key: 'greenFlags' | 'yellowFlags' | 'redFlags',
    label: string,
  ) => (
    <div className={classes.repeatCard}>
      <div className={classes.repeatHeader}>
        <strong>{label}</strong>
        <button className={classes.button} type="button" disabled={value[key].length >= LAUNCHPAD_DETAILS_LIMITS.flags} onClick={() => patch({ [key]: [...value[key], ''] })}>Add flag</button>
      </div>
      {value[key].map((flag, index) => (
        <div className={classes.assetActions} key={`${key}-${index}`}>
          <input className={classes.input} value={flag} onChange={(event) => updateFlag(key, index, event.target.value)} />
          <button className={`${classes.button} ${classes.dangerButton}`} type="button" onClick={() => patch({ [key]: value[key].filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
        </div>
      ))}
      {!value[key].length && <div className={classes.helper}>No launch-specific {label.toLowerCase()}.</div>}
    </div>
  );

  const renderStep = () => {
    if (activeStep === 1) {
      return (
        <>
          {projectPicker}
          <div className={projectPicker ? classes.section : ''}>
            <div className={classes.formGrid}>
              <label className={classes.field}>
                <span className={classes.label}>Launch slug *</span>
                <input
                  className={classes.input}
                  value={value.slug}
                  onChange={(event) => patch({ slug: slugifyLaunchpad(event.target.value) })}
                  placeholder="project-token-sale"
                />
                <span className={classes.helper}>Unique public path: /utility/launchpad/{value.slug || '…'}</span>
              </label>
              <label className={classes.field}>
                <span className={classes.label}>Launch title override</span>
                <input className={classes.input} value={value.title} onChange={setString('title')} />
                <span className={classes.helper}>Empty uses the canonical project name.</span>
              </label>
              <label className={`${classes.field} ${classes.fullWidth}`}>
                <span className={classes.label}>Short description *</span>
                <textarea className={`${classes.input} ${classes.textarea}`} value={value.shortDescription} onChange={setString('shortDescription')} />
              </label>
              <label className={classes.field}>
                <span className={classes.label}>Sale type *</span>
                <input className={classes.input} value={value.saleType} onChange={setString('saleType')} placeholder="IDO / Seed / Public" />
              </label>
              <label className={classes.field}>
                <span className={classes.label}>Category *</span>
                <input className={classes.input} value={value.category} onChange={setString('category')} placeholder="Infrastructure · L1" />
              </label>
            </div>
            <div className={classes.canonicalCard}>
              {identity.logoUrl
                ? <img className={classes.canonicalLogo} src={loader(identity.logoUrl)} alt="Resolved project logo" />
                : <div className={classes.canonicalLogo} />}
              <div>
                <strong>{identity.title || 'Project identity is incomplete'}</strong>
                <span className={classes.source}>{identity.titleSource}</span>
                <div className={classes.hint}>{identity.description || 'No description is available yet.'}</div>
                {canonicalProject && (
                  <div className={classes.helper} style={{ marginTop: 7 }}>
                    Linked canonical: {canonicalProject.name} · {canonicalProject.symbol || canonicalProject.slug || canonicalProject.id}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeStep === 2) {
      return (
        <>
          <div className={classes.formGrid}>
            <label className={`${classes.field} ${classes.fullWidth}`}>
              <span className={classes.label}>Full launch description</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.description} onChange={setString('description')} />
              <span className={classes.helper}>Empty uses canonical project description.</span>
            </label>
            <label className={`${classes.field} ${classes.fullWidth}`}>
              <span className={classes.label}>About</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.about} onChange={setString('about')} />
            </label>
            <label className={classes.field}>
              <span className={classes.label}>Problem *</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.problem} onChange={setString('problem')} />
            </label>
            <label className={classes.field}>
              <span className={classes.label}>Solution *</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.solution} onChange={setString('solution')} />
            </label>
            <label className={classes.field}>
              <span className={classes.label}>Token utility *</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.tokenUtility} onChange={setString('tokenUtility')} />
            </label>
            <label className={classes.field}>
              <span className={classes.label}>Revenue model</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.revenueModel} onChange={setString('revenueModel')} />
            </label>
          </div>
          <div className={classes.section}>
            <div className={classes.sectionTitle}>Funding and token display</div>
            <div className={classes.helper} style={{ marginBottom: 10 }}>
              These are launch-page labels only. Live pool raised amount, hard cap and user allocation continue to come from verified contract state. Text labels are saved exactly and are never converted through floating-point numbers.
            </div>
            <div className={classes.formGrid}>
              <label className={classes.field}>
                <span className={classes.label}>Historic total raised label</span>
                <input className={classes.input} value={value.fundingTotalRaisedLabel} onChange={setString('fundingTotalRaisedLabel')} placeholder="$12.5M" />
              </label>
              <label className={classes.field}>
                <span className={classes.label}>Funding type</span>
                <input className={classes.input} value={value.fundingType} onChange={setString('fundingType')} placeholder="Seed / Strategic" />
              </label>
              <label className={classes.field}>
                <span className={classes.label}>Token display name</span>
                <input className={classes.input} value={value.tokenName} onChange={setString('tokenName')} />
              </label>
              <label className={classes.field}>
                <span className={classes.label}>Token display symbol</span>
                <input className={classes.input} value={value.tokenSymbol} onChange={setString('tokenSymbol')} />
              </label>
              <label className={classes.field}>
                <span className={classes.label}>Token decimals</span>
                <input className={classes.input} inputMode="numeric" value={value.tokenDecimals} onChange={setString('tokenDecimals')} placeholder="18" />
              </label>
              <label className={classes.field}>
                <span className={classes.label}>Token price label</span>
                <input className={classes.input} value={value.tokenPriceLabel} onChange={setString('tokenPriceLabel')} placeholder="$0.025" />
              </label>
              <label className={`${classes.field} ${classes.fullWidth}`}>
                <span className={classes.label}>Allocation label</span>
                <input className={classes.input} value={value.tokenAllocationLabel} onChange={setString('tokenAllocationLabel')} placeholder="Up to 2,500 USDT" />
              </label>
            </div>
          </div>
          <div className={classes.section}>
            <div className={classes.repeatHeader}>
              <div>
                <div className={classes.sectionTitle}>Investors override</div>
                <div className={classes.helper}>
                  Leave empty to use canonical investors ({canonicalProject?.investors?.length || 0} currently available in preview).
                </div>
              </div>
              <button className={classes.button} type="button" disabled={value.investors.length >= LAUNCHPAD_DETAILS_LIMITS.investors} onClick={() => patch({
                investors: [...value.investors, { id: `investor-${Date.now()}`, name: '', logoUrl: '', website: '' }],
              })}>Add investor</button>
            </div>
            {value.investors.map((investor, index) => (
              <div className={classes.repeatCard} key={investor.id}>
                <div className={classes.formGrid}>
                  <label className={classes.field}>
                    <span className={classes.label}>Investor name</span>
                    <input className={classes.input} value={investor.name} onChange={(event) => updateInvestor(index, 'name', event.target.value)} />
                  </label>
                  <label className={classes.field}>
                    <span className={classes.label}>Website</span>
                    <input className={classes.input} value={investor.website} onChange={(event) => updateInvestor(index, 'website', event.target.value)} placeholder="https://…" />
                  </label>
                  <div className={classes.fullWidth}>
                    <LaunchpadAssetField label="Investor logo" value={investor.logoUrl} onChange={(url) => updateInvestor(index, 'logoUrl', url)} />
                  </div>
                </div>
                <div className={classes.assetActions}>
                  <button className={`${classes.button} ${classes.dangerButton}`} type="button" onClick={() => {
                    queueLaunchpadManagedMediaCleanup([investor.logoUrl]);
                    patch({ investors: value.investors.filter((_, itemIndex) => itemIndex !== index) });
                  }}>Remove investor</button>
                </div>
              </div>
            ))}
          </div>
          <div className={classes.section}>
            <div className={classes.repeatHeader}>
              <div>
                <div className={classes.sectionTitle}>Team override</div>
                <div className={classes.helper}>
                  Leave empty to use canonical team ({canonicalProject?.team?.length || 0} currently available in preview).
                </div>
              </div>
              <button className={classes.button} type="button" disabled={value.team.length >= LAUNCHPAD_DETAILS_LIMITS.team} onClick={() => patch({
                team: [...value.team, { id: `team-${Date.now()}`, name: '', role: '', avatarUrl: '', website: '' }],
              })}>Add team member</button>
            </div>
            {value.team.map((member, index) => (
              <div className={classes.repeatCard} key={member.id}>
                <div className={classes.formGrid}>
                  <label className={classes.field}>
                    <span className={classes.label}>Name</span>
                    <input className={classes.input} value={member.name} onChange={(event) => updateTeamMember(index, 'name', event.target.value)} />
                  </label>
                  <label className={classes.field}>
                    <span className={classes.label}>Role</span>
                    <input className={classes.input} value={member.role} onChange={(event) => updateTeamMember(index, 'role', event.target.value)} />
                  </label>
                  <label className={`${classes.field} ${classes.fullWidth}`}>
                    <span className={classes.label}>Website</span>
                    <input className={classes.input} value={member.website} onChange={(event) => updateTeamMember(index, 'website', event.target.value)} placeholder="https://…" />
                  </label>
                  <div className={classes.fullWidth}>
                    <LaunchpadAssetField label="Team avatar" value={member.avatarUrl} onChange={(url) => updateTeamMember(index, 'avatarUrl', url)} />
                  </div>
                </div>
                <div className={classes.assetActions}>
                  <button className={`${classes.button} ${classes.dangerButton}`} type="button" onClick={() => {
                    queueLaunchpadManagedMediaCleanup([member.avatarUrl]);
                    patch({ team: value.team.filter((_, itemIndex) => itemIndex !== index) });
                  }}>Remove team member</button>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (activeStep === 3) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <LaunchpadAssetField
            label="Launch logo override"
            value={value.logoUrl}
            inheritedValue={canonicalProject?.logo}
            inheritedLabel="Empty uses the canonical project logo"
            onChange={(logoUrl) => patch({ logoUrl })}
          />
          <LaunchpadAssetField
            label="Launch detail banner"
            value={value.bannerUrl}
            onChange={(bannerUrl) => patch({ bannerUrl })}
          />
          <div className={classes.section}>
            <div className={classes.repeatHeader}>
              <div>
                <div className={classes.sectionTitle}>Gallery</div>
                <div className={classes.helper}>These images belong to the launch detail page, not Featured/Ad placements.</div>
              </div>
              <button className={classes.button} type="button" disabled={value.gallery.length >= LAUNCHPAD_DETAILS_LIMITS.gallery} onClick={() => patch({ gallery: [...value.gallery, ''] })}>Add image</button>
            </div>
            {value.gallery.map((item, index) => (
              <div className={classes.repeatCard} key={`gallery-${index}`}>
                <div className={classes.repeatHeader}>
                  <strong>Gallery image {index + 1}</strong>
                  <div className={classes.galleryActions}>
                    <button className={classes.button} type="button" disabled={index === 0} onClick={() => moveGallery(index, -1)}>↑</button>
                    <button className={classes.button} type="button" disabled={index === value.gallery.length - 1} onClick={() => moveGallery(index, 1)}>↓</button>
                    <button className={`${classes.button} ${classes.dangerButton}`} type="button" onClick={() => {
                      queueLaunchpadManagedMediaCleanup([item]);
                      patch({ gallery: value.gallery.filter((_, itemIndex) => itemIndex !== index) });
                    }}>Remove</button>
                  </div>
                </div>
                <LaunchpadAssetField
                  label={`Gallery image ${index + 1}`}
                  value={item}
                  onChange={(nextValue) => patch({
                    gallery: value.gallery.map((galleryItem, itemIndex) => (
                      itemIndex === index ? nextValue : galleryItem
                    )),
                  })}
                />
              </div>
            ))}
            {!value.gallery.length && <div className={classes.helper}>No optional gallery images.</div>}
          </div>
        </div>
      );
    }

    if (activeStep === 4) return poolStep;

    if (activeStep === 5) {
      return (
        <>
          <div className={classes.formGrid}>
            <label className={classes.field}>
              <span className={classes.label}>Green zone description</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.greenZoneDescription} onChange={setString('greenZoneDescription')} />
            </label>
            <label className={classes.field}>
              <span className={classes.label}>Yellow zone description</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.yellowZoneDescription} onChange={setString('yellowZoneDescription')} />
            </label>
            <label className={`${classes.field} ${classes.fullWidth}`}>
              <span className={classes.label}>Red/waiting zone description</span>
              <textarea className={`${classes.input} ${classes.textarea}`} value={value.redZoneDescription} onChange={setString('redZoneDescription')} />
            </label>
          </div>
          <div className={classes.section}>
            <div className={classes.repeatHeader}>
              <div className={classes.sectionTitle}>Participation rules</div>
              <button className={classes.button} type="button" disabled={value.participationRules.length >= LAUNCHPAD_DETAILS_LIMITS.participationRules} onClick={() => patch({ participationRules: [...value.participationRules, ''] })}>Add rule</button>
            </div>
            {value.participationRules.map((rule, index) => (
              <div className={classes.repeatCard} key={`rule-${index}`}>
                <label className={classes.field}>
                  <span className={classes.label}>Rule {index + 1}</span>
                  <input className={classes.input} value={rule} onChange={(event) => updateRule(index, event.target.value)} />
                </label>
                <div className={classes.assetActions}>
                  <button className={`${classes.button} ${classes.dangerButton}`} type="button" onClick={() => patch({ participationRules: value.participationRules.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className={classes.section}>
            <div className={classes.repeatHeader}>
              <div className={classes.sectionTitle}>FAQ</div>
              <button className={classes.button} type="button" disabled={value.faq.length >= LAUNCHPAD_DETAILS_LIMITS.faq} onClick={() => patch({
                faq: [...value.faq, { id: `faq-${Date.now()}`, question: '', answer: '' }],
              })}>Add FAQ</button>
            </div>
            {value.faq.map((item, index) => (
              <div className={classes.repeatCard} key={item.id}>
                <div className={classes.formGrid}>
                  <label className={`${classes.field} ${classes.fullWidth}`}>
                    <span className={classes.label}>Question</span>
                    <input className={classes.input} value={item.question} onChange={(event) => updateFaq(index, 'question', event.target.value)} />
                  </label>
                  <label className={`${classes.field} ${classes.fullWidth}`}>
                    <span className={classes.label}>Answer</span>
                    <textarea className={`${classes.input} ${classes.textarea}`} value={item.answer} onChange={(event) => updateFaq(index, 'answer', event.target.value)} />
                  </label>
                </div>
                <div className={classes.assetActions}>
                  <button className={`${classes.button} ${classes.dangerButton}`} type="button" onClick={() => patch({ faq: value.faq.filter((_, itemIndex) => itemIndex !== index) })}>Remove FAQ</button>
                </div>
              </div>
            ))}
          </div>
          <div className={classes.section}>
            <div className={classes.sectionTitle}>Analysis flags override</div>
            <div className={classes.helper}>
              Leave all lists empty to use canonical/scoring flags ({
                (canonicalProject?.analysisFlags?.green?.length || 0)
                + (canonicalProject?.analysisFlags?.yellow?.length || 0)
                + (canonicalProject?.analysisFlags?.red?.length || 0)
              } currently available in preview).
            </div>
            {renderFlagEditor('greenFlags', 'Green flags')}
            {renderFlagEditor('yellowFlags', 'Yellow flags')}
            {renderFlagEditor('redFlags', 'Red flags')}
          </div>
          <div className={classes.readiness}>
            The current contract has no configurable soft cap, whitelist, vesting or pause settings. They are deliberately not exposed here. Target amount remains the hard cap; refund/claim state comes from verified contract data.
          </div>
        </>
      );
    }

    if (activeStep === 6) {
      return (
        <>
          <div className={classes.formGrid}>
          {([
            ['website', 'Website', canonicalProject?.website || ''],
            ['twitter', 'X / Twitter', ''],
            ['telegram', 'Telegram', ''],
            ['discord', 'Discord', ''],
            ['whitepaper', 'Whitepaper', ''],
          ] as Array<[keyof LaunchpadDetailsForm, string, string]>).map(([key, label, inherited]) => (
            <label className={classes.field} key={key}>
              <span className={classes.label}>{label} override</span>
              <input className={classes.input} value={String(value[key])} onChange={setString(key)} placeholder="https://…" />
              {inherited && !value[key] && <span className={classes.helper}>Inherited: {inherited}</span>}
            </label>
            ))}
          </div>
          <div className={classes.section}>
            <div className={classes.repeatHeader}>
              <div>
                <div className={classes.sectionTitle}>Documents</div>
                <div className={classes.helper}>Whitepaper, audit, tokenomics or other launch-specific document links.</div>
              </div>
              <button className={classes.button} type="button" disabled={value.documents.length >= LAUNCHPAD_DETAILS_LIMITS.documents} onClick={() => patch({
                documents: [...value.documents, {
                  id: `document-${Date.now()}`,
                  title: '',
                  url: '',
                  type: '',
                }],
              })}>Add document</button>
            </div>
            {value.documents.map((document, index) => (
              <div className={classes.repeatCard} key={document.id}>
                <div className={classes.formGrid}>
                  <label className={classes.field}>
                    <span className={classes.label}>Title</span>
                    <input className={classes.input} value={document.title} onChange={(event) => updateDocument(index, 'title', event.target.value)} />
                  </label>
                  <label className={classes.field}>
                    <span className={classes.label}>Type</span>
                    <input className={classes.input} value={document.type} onChange={(event) => updateDocument(index, 'type', event.target.value)} placeholder="Audit / PDF / Tokenomics" />
                  </label>
                  <label className={`${classes.field} ${classes.fullWidth}`}>
                    <span className={classes.label}>URL</span>
                    <input className={classes.input} value={document.url} onChange={(event) => updateDocument(index, 'url', event.target.value)} placeholder="https://…" />
                  </label>
                </div>
                <div className={classes.assetActions}>
                  <button className={`${classes.button} ${classes.dangerButton}`} type="button" onClick={() => patch({ documents: value.documents.filter((_, itemIndex) => itemIndex !== index) })}>Remove document</button>
                </div>
              </div>
            ))}
            {!value.documents.length && <div className={classes.helper}>No launch-specific documents.</div>}
          </div>
          <div className={classes.section}>
            <div className={classes.sectionTitle}>Detail-page sections</div>
            <div className={classes.helper} style={{ marginBottom: 10 }}>
              These flags only control sections inside the launch detail page. Featured and Ad placement remains configured separately per page.
            </div>
            <div className={classes.formGrid}>
              {([
                ['showLeaderboard', 'Leaderboard'],
                ['showParticipants', 'Participants'],
                ['showCountdown', 'Countdown'],
              ] as Array<[
                'showLeaderboard' | 'showParticipants' | 'showCountdown',
                string,
              ]>).map(([key, label]) => (
                <label className={classes.field} key={key}>
                  <span className={classes.label}>{label}</span>
                  <select
                    className={classes.input}
                    value={value[key]}
                    onChange={(event) => patch({ [key]: event.target.value as LaunchpadDetailsForm[typeof key] })}
                  >
                    <option value="default">Use public default</option>
                    <option value="show">Show section</option>
                    <option value="hide">Hide section</option>
                  </select>
                </label>
              ))}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className={classes.previewGrid}>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Resolved title</div>
            {identity.title || 'Missing'} <span className={classes.source}>{identity.titleSource}</span>
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Public path</div>
            /utility/launchpad/{value.slug || 'missing'}
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Sale</div>
            {value.saleType || 'Missing'} · {value.category || 'Missing'}
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Resolved website</div>
            {identity.website || 'Not supplied'} <span className={classes.source}>{identity.websiteSource}</span>
          </div>
          <div className={`${classes.previewItem} ${classes.fullWidth}`}>
            <div className={classes.previewLabel}>Description</div>
            {identity.description || 'Missing'} <span className={classes.source}>{identity.descriptionSource}</span>
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Media</div>
            {identity.logoUrl ? 'Logo ready' : 'Logo missing'} · {value.bannerUrl ? 'Detail banner ready' : 'Detail banner missing'} · {value.gallery.filter(Boolean).length} gallery images
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Content</div>
            {value.participationRules.filter(Boolean).length} rules · {value.faq.filter((item) => item.question && item.answer).length} FAQ
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Investors / team</div>
            {value.investors.length || canonicalProject?.investors?.length || 0} investors · {value.team.length || canonicalProject?.team?.length || 0} team members
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Analysis flags</div>
            {value.greenFlags.length + value.yellowFlags.length + value.redFlags.length || (
              (canonicalProject?.analysisFlags?.green?.length || 0)
              + (canonicalProject?.analysisFlags?.yellow?.length || 0)
              + (canonicalProject?.analysisFlags?.red?.length || 0)
            )} flags
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Funding / token display</div>
            {value.fundingTotalRaisedLabel || 'No historic raised label'} · {value.fundingType || 'No funding type'} · {value.tokenSymbol || 'No token symbol'} · {value.tokenPriceLabel || 'No price label'}
          </div>
          <div className={classes.previewItem}>
            <div className={classes.previewLabel}>Documents / optional sections</div>
            {value.documents.filter((item) => item.title && item.url).length} documents · leaderboard {value.showLeaderboard} · participants {value.showParticipants} · countdown {value.showCountdown}
          </div>
        </div>
        {poolPreview && <div className={classes.section}>{poolPreview}</div>}
        <div className={`${classes.readiness} ${!clientIssues.length && readiness?.ready ? classes.ready : ''}`}>
          <strong>{clientIssues.length ? 'Client validation issues' : readiness?.ready ? 'Backend reports ready to publish' : mode === 'create' ? 'Content validation passed' : 'Backend readiness'}</strong>
          {(clientIssues.length || backendIssues.length) ? (
            <ul className={classes.issueList}>
              {[...clientIssues, ...backendIssues].map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}
            </ul>
          ) : (
            <div className={classes.helper} style={{ marginTop: 5 }}>
              Publication readiness is authoritative on the backend and also includes verified chain state.
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className={classes.wizard}>
      <nav className={classes.navigation} aria-label="Launch details steps">
        {STEPS.map(([title], index) => {
          const step = index + 1;
          return (
            <button
              className={`${classes.navigationButton} ${activeStep === step ? classes.activeNavigationButton : ''}`}
              type="button"
              key={title}
              onClick={() => setActiveStep(step)}
            >
              <span className={classes.stepNumber}>{step}</span>
              <span>{title}</span>
            </button>
          );
        })}
      </nav>
      <section className={classes.content}>
        <header className={classes.header}>
          <div>
            <div className={classes.title}>{activeStep}. {STEPS[activeStep - 1][0]}</div>
            <div className={classes.hint}>{STEPS[activeStep - 1][1]}</div>
          </div>
          <div className={classes.helper}>{mode === 'create' ? 'New launch' : 'Edit launch data'}</div>
        </header>
        <fieldset
          disabled={formDisabled}
          aria-busy={formDisabled}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <div className={classes.body}>{renderStep()}</div>
        </fieldset>
        <footer className={classes.footer}>
          <button className={classes.button} type="button" disabled={activeStep === 1} onClick={() => setActiveStep((current) => Math.max(1, current - 1))}>Previous</button>
          {activeStep < STEPS.length ? (
            <button className={`${classes.button} ${classes.primaryButton}`} type="button" onClick={goNext}>Next step</button>
          ) : (
            <button
              className={`${classes.button} ${classes.primaryButton}`}
              type="button"
              disabled={primaryDisabled || primaryBusy}
              onClick={() => submit().catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : 'Launch action failed');
              })}
            >{primaryBusy ? 'Saving…' : primaryLabel}</button>
          )}
        </footer>
      </section>
    </div>
  );
};

export default LaunchpadDetailsWizard;
