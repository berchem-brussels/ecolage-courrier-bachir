/** Aide : mode d'emploi, FAQ et contact (patron SAGA HelpPage.tsx). Chaque fonctionnalité ajoute sa rubrique et sa question. */
import { Card, Collapse, Tabs, Typography } from 'antd';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';

export default function HelpPage() {
  const { t } = useI18n();
  const { settings } = useSettings();
  return (
    <div>
      <Typography.Title level={1} style={{ fontSize: 22, marginBottom: 16 }}>{t('help.title')}</Typography.Title>
      <Card>
        <Tabs items={[
          { key: 'guide', label: t('help.guide'), children: (
            <Collapse items={[
              { key: 'registration', label: t('nav.registration'), children: <Typography.Paragraph>{t('help.guide.registration')}</Typography.Paragraph> },
              { key: 'inbox', label: t('nav.inbox'), children: <Typography.Paragraph>{t('help.guide.inbox')}</Typography.Paragraph> },
              { key: 'register', label: t('nav.register'), children: <Typography.Paragraph>{t('help.guide.register')}</Typography.Paragraph> },
              { key: 'files', label: t('piece.files'), children: <Typography.Paragraph>{t('help.guide.files')}</Typography.Paragraph> },
              { key: 'consultations', label: t('nav.consultations'), children: <Typography.Paragraph>{t('help.guide.consultations')}</Typography.Paragraph> },
              { key: 'admin', label: t('nav.group.admin'), children: <Typography.Paragraph>{t('help.guide.admin')}</Typography.Paragraph> },
            ]} />
          ) },
          { key: 'faq', label: t('help.faq'), children: (
            <Collapse items={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ key: String(n), label: t(`help.faq.q${n}`), children: <Typography.Paragraph>{t(`help.faq.a${n}`)}</Typography.Paragraph> }))} />
          ) },
          { key: 'contact', label: t('help.contact'), children: <Typography.Paragraph>{settings.app.support_contact}</Typography.Paragraph> },
        ]} />
      </Card>
    </div>
  );
}
