/** Bouton « Aide » de l'en-tête commun : la fiche de l'écran en cours s'ouvre dans un panneau latéral, sans quitter l'écran. */
import { useState } from 'react';
import { Button, Drawer, Grid } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { topicForPath } from './index';
import TopicView from './TopicView';

export default function HelpButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const [open, setOpen] = useState(false);
  const topic = topicForPath(location.pathname);
  if (!topic) return null;
  return (
    <>
      <Button size="small" aria-label={t('help.button')} icon={<QuestionCircleOutlined />} onClick={() => setOpen(true)}>{compact ? null : t('help.button')}</Button>
      <Drawer destroyOnClose open={open} onClose={() => setOpen(false)} width={screens.md === false ? '100%' : 760} title={t('help.title')}
        extra={<Link to={`/help#help-${topic.id}`} onClick={() => setOpen(false)}>{t('help.full')}</Link>}>
        <TopicView topic={topic} anchor={false} />
      </Drawer>
    </>
  );
}
