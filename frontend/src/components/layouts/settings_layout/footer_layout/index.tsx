import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ILegal, ISocial, IFooterApps } from '../../../types/global_types';
import useFetch from '../../../hooks/useFetch';
import Button from '../../../common/button';
import TextModal from '../../../common/text_modal/TextModal';
import updateFooter from '../../../services/layout/updateFooter';
import Loader from '../../../common/loader';
import { useStyles } from './styles';

type LegalKey = keyof ILegal;
type SocialKey = keyof ISocial;
type AppsKey = keyof IFooterApps;

const EMPTY_LEGAL: ILegal = {
  policy: '',
  terms: '',
  disclaimer: '',
  careers: '',
};

const EMPTY_SOCIAL: ISocial = {
  email: '',
  twitter: '',
  telegramRu: '',
  telegramEn: '',
  youtube: '',
  discord: '',
  instagram: '',
  tikTok: '',
  linktree: '',
};

const EMPTY_APPS: IFooterApps = {
  telegramMiniApp: '',
  appStore: '',
  googlePlay: '',
  fomoIntel: '',
  fomoAi: '',
  whitepaper: '',
  lightpaper: '',
};

const LEGAL_DOCUMENTS: Array<{
  key: LegalKey;
  title: string;
  description: string;
}> = [
  {
    key: 'policy',
    title: 'Политика конфиденциальности',
    description: 'Конфиденциальность, сбор данных, cookie и права пользователей.',
  },
  {
    key: 'terms',
    title: 'Условия использования',
    description: 'Правила платформы, ответственность и допустимое использование.',
  },
  {
    key: 'disclaimer',
    title: 'Дисклеймер',
    description: 'Риски, точность данных и отказ от ответственности.',
  },
  {
    key: 'careers',
    title: 'Карьера',
    description: 'Информация о вакансиях и рекомендации кандидатам.',
  },
];

const SOCIAL_FIELDS: Array<{
  key: SocialKey;
  label: string;
  placeholder: string;
  type?: 'email' | 'url' | 'text';
}> = [
  { key: 'email', label: 'Email', placeholder: 'team@fomo.land', type: 'email' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/fomoland', type: 'url' },
  { key: 'telegramRu', label: 'Telegram (чат)', placeholder: 'https://t.me/...', type: 'url' },
  { key: 'telegramEn', label: 'Telegram (канал)', placeholder: 'https://t.me/...', type: 'url' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...', type: 'url' },
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/...', type: 'url' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...', type: 'url' },
  { key: 'tikTok', label: 'TikTok', placeholder: 'https://tiktok.com/@...', type: 'url' },
  { key: 'linktree', label: 'Linktree', placeholder: 'https://linktr.ee/...', type: 'url' },
];

const APPS_FIELDS: Array<{
  key: AppsKey;
  label: string;
  placeholder: string;
  hint: string;
  group: 'apps' | 'products' | 'resources';
}> = [
  { key: 'telegramMiniApp', label: 'Telegram Mini App', placeholder: 'https://t.me/your_bot/app', hint: 'Показывается отдельной иконкой Mini App в футере. Оставьте пустым, чтобы скрыть.', group: 'apps' },
  { key: 'appStore', label: 'App Store', placeholder: 'https://apps.apple.com/app/...', hint: 'Кнопка загрузки для iOS. Если пусто — ведёт на ссылку FOMO Intel.', group: 'apps' },
  { key: 'googlePlay', label: 'Google Play', placeholder: 'https://play.google.com/store/apps/...', hint: 'Кнопка загрузки для Android. Если пусто — ведёт на ссылку FOMO Intel.', group: 'apps' },
  { key: 'fomoIntel', label: 'Ссылка FOMO Intel', placeholder: 'https://i.fomo.cx/', hint: 'Внешняя ссылка на продукт FOMO Intel (колонка Products).', group: 'products' },
  { key: 'fomoAi', label: 'Маршрут FOMO AI', placeholder: '/ai', hint: 'Внутренний маршрут продукта FOMO AI (колонка Products).', group: 'products' },
  { key: 'whitepaper', label: 'Whitepaper', placeholder: 'https://.../whitepaper.pdf', hint: 'Колонка Resources. Скрывается вместе с колонкой, если обе ссылки пустые.', group: 'resources' },
  { key: 'lightpaper', label: 'Lightpaper', placeholder: 'https://.../lightpaper.pdf', hint: 'Колонка Resources. Скрывается вместе с колонкой, если обе ссылки пустые.', group: 'resources' },
];

const APPS_GROUPS: Array<{ key: 'apps' | 'products' | 'resources'; title: string }> = [
  { key: 'apps', title: 'Приложения и Telegram Mini App' },
  { key: 'products', title: 'Колонка Products' },
  { key: 'resources', title: 'Колонка Resources' },
];

const htmlToPlainText = (html: string): string => {
  if (!html.trim()) return '';
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const document = new DOMParser().parseFromString(html, 'text/html');
  return String(document.body.textContent || '').replace(/\s+/g, ' ').trim();
};

const contentStats = (html: string) => {
  const text = htmlToPlainText(html);
  return {
    characters: text.length,
    words: text ? text.split(/\s+/).length : 0,
    excerpt: text.length > 118 ? `${text.slice(0, 118).trim()}...` : text,
  };
};

const errorMessage = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value;
  if (value instanceof Error) return value.message;
  return 'Не удалось сохранить настройки футера';
};

const FooterLayout = () => {
  const classes = useStyles();
  const { data, loading } = useFetch('layout');
  const [activeLegalKey, setActiveLegalKey] = useState<LegalKey | null>(null);
  const [legal, setLegal] = useState<ILegal>(EMPTY_LEGAL);
  const [social, setSocial] = useState<ISocial>(EMPTY_SOCIAL);
  const [apps, setApps] = useState<IFooterApps>(EMPTY_APPS);
  const [legalBaseline, setLegalBaseline] = useState<ILegal>(EMPTY_LEGAL);
  const [socialBaseline, setSocialBaseline] = useState<ISocial>(EMPTY_SOCIAL);
  const [appsBaseline, setAppsBaseline] = useState<IFooterApps>(EMPTY_APPS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const footer = data?.data?.footer;
    if (!footer) return;

    const nextLegal = { ...EMPTY_LEGAL, ...(footer.legal || {}) } as ILegal;
    const nextSocial = { ...EMPTY_SOCIAL, ...(footer.social || {}) } as ISocial;
    const nextApps = { ...EMPTY_APPS, ...(footer.apps || {}) } as IFooterApps;
    setLegal(nextLegal);
    setLegalBaseline(nextLegal);
    setSocial(nextSocial);
    setSocialBaseline(nextSocial);
    setApps(nextApps);
    setAppsBaseline(nextApps);
  }, [data]);

  const socialDirty = useMemo(
    () => JSON.stringify(social) !== JSON.stringify(socialBaseline),
    [social, socialBaseline],
  );
  const legalDirty = useMemo(
    () => JSON.stringify(legal) !== JSON.stringify(legalBaseline),
    [legal, legalBaseline],
  );
  const appsDirty = useMemo(
    () => JSON.stringify(apps) !== JSON.stringify(appsBaseline),
    [apps, appsBaseline],
  );
  const activeDocument = LEGAL_DOCUMENTS.find(({ key }) => key === activeLegalKey);

  const publishSnapshot = async (
    nextLegal: ILegal,
    nextSocial: ISocial,
    nextApps: IFooterApps,
    successMessage: string,
  ): Promise<boolean> => {
    if (saving) return false;
    setSaving(true);
    try {
      const response = await updateFooter({ legal: nextLegal, social: nextSocial, apps: nextApps });
      if (!response.success) {
        toast.error(errorMessage(response.data));
        return false;
      }

      toast.success(successMessage);
      return true;
    } finally {
      setSaving(false);
    }
  };

  const saveLegalDocument = async (html: string): Promise<boolean> => {
    if (!activeLegalKey || !activeDocument) return false;
    const nextLegal = { ...legal, [activeLegalKey]: html };
    const success = await publishSnapshot(
      nextLegal,
      socialBaseline,
      appsBaseline,
      `${activeDocument.title} — опубликовано`,
    );
    if (success) {
      setLegal(nextLegal);
      setLegalBaseline(nextLegal);
    }
    return success;
  };

  const saveSocial = async () => {
    const success = await publishSnapshot(
      legalBaseline,
      social,
      appsBaseline,
      'Контакты футера сохранены',
    );
    if (success) setSocialBaseline(social);
    return success;
  };

  const saveApps = async () => {
    const success = await publishSnapshot(
      legalBaseline,
      socialBaseline,
      apps,
      'Приложения и ссылки сохранены',
    );
    if (success) setAppsBaseline(apps);
    return success;
  };

  if (loading) return <Loader />;

  const anyDirty = socialDirty || legalDirty || appsDirty;

  return (
    <div className={classes.page}>
      <header className={classes.hero}>
        <div>
          <p className={classes.eyebrow}>Контент публичного сайта</p>
          <h2 className={classes.title}>Футер и документы</h2>
          <p className={classes.heroDescription}>
            Поддерживайте публичные документы и контактные ссылки, отображаемые на сайте, в актуальном виде.
          </p>
        </div>
        <span
          className={`${classes.syncBadge} ${anyDirty ? classes.syncBadgeDirty : ''}`}
          aria-live="polite"
        >
          <span className={classes.syncDot} />
          {saving ? 'Сохранение...' : anyDirty ? 'Несохранённые изменения' : 'Синхронизировано'}
        </span>
      </header>

      <div className={classes.snapshotNotice} role="note">
        <strong>Единый снапшот футера.</strong>
        {' '}Каждый запрос содержит правовые и социальные значения; несохранённые правки в другой секции остаются локально, пока вы их не сохраните.
      </div>

      <section className={classes.panel} aria-labelledby="legal-documents-title">
        <div className={classes.panelHeader}>
          <div>
            <h3 className={classes.panelTitle} id="legal-documents-title">Правовые документы</h3>
            <p className={classes.panelDescription}>
              Используйте структурированные заголовки и списки, чтобы фронтенд единообразно оформлял сгенерированный HTML.
            </p>
          </div>
          <span className={classes.panelPill}>{LEGAL_DOCUMENTS.length} докум.</span>
        </div>
        <div className={classes.legalGrid}>
          {LEGAL_DOCUMENTS.map((document) => {
            const stats = contentStats(legal[document.key]);
            const populated = stats.characters > 0;
            return (
              <article className={classes.legalCard} key={document.key}>
                <div className={classes.cardTop}>
                  <div className={classes.documentIcon} aria-hidden="true">
                    {document.title.slice(0, 1)}
                  </div>
                  <span className={`${classes.contentStatus} ${populated ? '' : classes.emptyStatus}`}>
                    {populated ? 'Готово' : 'Пусто'}
                  </span>
                </div>
                <div>
                  <h4 className={classes.cardTitle}>{document.title}</h4>
                  <p className={classes.cardDescription}>{document.description}</p>
                </div>
                <p className={`${classes.excerpt} ${populated ? '' : classes.emptyExcerpt}`}>
                  {stats.excerpt || 'Добавьте первую версию этого документа.'}
                </p>
                <div className={classes.cardFooter}>
                  <span className={classes.cardMeta}>
                    {stats.words.toLocaleString()} слов / {stats.characters.toLocaleString()} симв.
                  </span>
                  <Button
                    className={classes.editButton}
                    type="lightFill"
                    onClick={() => setActiveLegalKey(document.key)}
                    disabled={saving}
                  >
                    Редактировать
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={classes.panel} aria-labelledby="footer-contacts-title">
        <div className={classes.panelHeader}>
          <div>
            <h3 className={classes.panelTitle} id="footer-contacts-title">Контакты и соцсети</h3>
            <p className={classes.panelDescription}>
              Указывайте полные публичные URL. Пустые поля скрываются на сайте там, где это поддерживается.
            </p>
          </div>
          <span className={`${classes.panelPill} ${socialDirty ? classes.panelPillDirty : ''}`}>
            {socialDirty ? 'Не сохранено' : 'Актуально'}
          </span>
        </div>
        <div className={classes.formGrid}>
          {SOCIAL_FIELDS.map((field) => (
            <div className={classes.inputWrapper} key={field.key}>
              <label className={classes.label} htmlFor={`footer-${field.key}`}>
                {field.label}
              </label>
              <input
                id={`footer-${field.key}`}
                value={social[field.key]}
                onChange={(event) => setSocial((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))}
                className={classes.input}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                disabled={saving}
              />
            </div>
          ))}
        </div>
        <div className={classes.saveBar}>
          <p className={socialDirty ? classes.dirtyText : classes.savedText}>
            {socialDirty
              ? 'Проверьте значения и сохраните снапшот футера.'
              : 'Контакты соответствуют последнему успешному ответу сервера.'}
          </p>
          <div className={classes.actions}>
            <Button
              type="lightFill"
              onClick={() => setSocial(socialBaseline)}
              disabled={!socialDirty || saving}
            >
              Сбросить
            </Button>
            <Button
              className={classes.saveButton}
              type="fill"
              onClick={saveSocial}
              disabled={!socialDirty || saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить контакты'}
            </Button>
          </div>
        </div>
      </section>

      <section className={classes.panel} aria-labelledby="footer-apps-title">
        <div className={classes.panelHeader}>
          <div>
            <h3 className={classes.panelTitle} id="footer-apps-title">Приложения, продукты и ресурсы</h3>
            <p className={classes.panelDescription}>
              Настройте Telegram Mini App, кнопки сторов, а также ссылки колонок Products и Resources. Пустые поля скрыты на сайте, а колонка Resources исчезает целиком, если оба документа пусты.
            </p>
          </div>
          <span className={`${classes.panelPill} ${appsDirty ? classes.panelPillDirty : ''}`}>
            {appsDirty ? 'Не сохранено' : 'Актуально'}
          </span>
        </div>

        <div className={classes.appsBody}>
          {APPS_GROUPS.map((group) => (
            <div key={group.key} className={classes.appsGroup}>
              <div className={classes.groupTitle}>{group.title}</div>
              <div className={classes.appsGrid}>
                {APPS_FIELDS.filter((f) => f.group === group.key).map((field) => (
                  <div className={classes.inputWrapper} key={field.key}>
                    <label className={classes.label} htmlFor={`footer-app-${field.key}`}>
                      {field.label}
                    </label>
                    <input
                      id={`footer-app-${field.key}`}
                      data-testid={`footer-app-${field.key}`}
                      value={apps[field.key]}
                      onChange={(event) => setApps((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))}
                      className={classes.input}
                      type="text"
                      placeholder={field.placeholder}
                      disabled={saving}
                    />
                    <span className={classes.hint}>{field.hint}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={classes.saveBar}>
          <p className={appsDirty ? classes.dirtyText : classes.savedText}>
            {appsDirty
              ? 'Сохраните, чтобы опубликовать Mini App, кнопки сторов и ссылки на сайте.'
              : 'Ссылки соответствуют последнему успешному ответу сервера.'}
          </p>
          <div className={classes.actions}>
            <Button
              type="lightFill"
              onClick={() => setApps(appsBaseline)}
              disabled={!appsDirty || saving}
            >
              Сбросить
            </Button>
            <Button
              className={classes.saveButton}
              type="fill"
              onClick={saveApps}
              disabled={!appsDirty || saving}
              data-testid="footer-apps-save"
            >
              {saving ? 'Сохранение...' : 'Сохранить приложения и ссылки'}
            </Button>
          </div>
        </div>
      </section>

      {activeLegalKey && activeDocument ? (
        <TextModal
          key={activeLegalKey}
          value={legal[activeLegalKey]}
          title={activeDocument.title}
          description={`${activeDocument.description} Превью использует ту же семантическую HTML-структуру, что и публичная страница.`}
          ariaLabel={activeDocument.title}
          saveLabel="Сохранить и опубликовать"
          confirmDiscard
          onClose={() => setActiveLegalKey(null)}
          onSave={saveLegalDocument}
        />
      ) : null}
    </div>
  );
};

export default FooterLayout;
