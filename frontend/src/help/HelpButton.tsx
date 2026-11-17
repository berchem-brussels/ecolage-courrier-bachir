/** Bouton « Aide » de l'en-tête commun : la fiche de l'écran en cours s'ouvre dans un panneau latéral, sans quitter l'écran. */
import { useEffect, useState } from 'react';
import { Button, Drawer, Grid } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';
import { topicForPath } from './index';
import TopicView, { type LocalFaq } from './TopicView';

export default function HelpButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const [open, setOpen] = useState(false);
  const [faq, setFaq] = useState<LocalFaq[]>([]);
  const topic = topicForPath(location.pathname);
  useEffect(() => {
    if (open && topic) api.page<LocalFaq>(`/faq?topic_id=${topic.id}`).then((r) => setFaq((Array.isArray(r.data) ? r.data : []).filter((f) => f.is_active !== 0))).catch(() => setFaq([]));
  }, [open, topic]);
  if (!topic) return null;
  return (
    <>
      <Button size="small" aria-label={t('help.button')} icon={<QuestionCircleOutlined />} onClick={() => setOpen(true)}>{compact ? null : t('help.button')}</Button>
      <Drawer destroyOnClose open={open} onClose={() => setOpen(false)} width={screens.md === false ? '100%' : 760} title={t('help.title')}
        extra={<Link to={`/help#help-${topic.id}`} onClick={() => setOpen(false)}>{t('help.full')}</Link>}>
        <TopicView topic={topic} anchor={false} localFaq={faq} />
      </Drawer>
    </>
  );
}
