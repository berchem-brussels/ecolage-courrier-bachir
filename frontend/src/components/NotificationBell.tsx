/**
 * Cloche de notifications de l'en-tête (CDC CE-140) : nombre de non lues, liste, lien vers la fiche du courrier.
 * Une notification porte le numéro du courrier et sa nature, jamais l'objet. Relue toutes les minutes et à l'ouverture.
 */
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, List, Popover, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

interface Notification { id: number; kind: 'attribue' | 'service' | 'copie' | 'renvoye' | 'commente' | 'clos' | 'rouvert'; mail_id: number; mail_number: string; entity_code: string; created_at: string; read_at: string | null }

export default function NotificationBell({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.withMeta<Notification[]>('/notifications?limit=20');
      if (!Array.isArray(r.data)) return;
      setRows(r.data);
      setUnread(typeof r.meta.unread === 'number' ? r.meta.unread : r.data.filter((n) => !n.read_at).length);
    } catch { /* la cloche reste telle quelle : une notification manquée ne bloque rien */ }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  const markAll = async () => { try { await api.post('/notifications/read', {}); } finally { load(); } };
  const go = async (n: Notification) => {
    try { await api.post('/notifications/read', { ids: [n.id] }); } finally { load(); }
    setOpen(false);
    navigate(`/bannettes?entite=${n.entity_code}&courrier=${n.mail_id}`);
  };

  const content = (
    <div style={{ width: 300, maxWidth: '80vw' }}>
      {rows.length === 0 ? <Typography.Text type="secondary">{t('notif.empty')}</Typography.Text> : (
        <>
          <List size="small" dataSource={rows} renderItem={(n) => (
            <List.Item key={n.id} style={{ padding: 0 }}>
              <Button type="text" block onClick={() => go(n)} style={{ height: 'auto', textAlign: 'left', whiteSpace: 'normal', padding: '6px 4px' }}>
                <div style={{ fontWeight: n.read_at ? 400 : 600 }}>{t(`notif.kind.${n.kind}`)}</div>
                <div style={{ fontSize: 12 }}>{n.mail_number} · {dayjs.utc(n.created_at).local().format('L LT')}</div>
              </Button>
            </List.Item>
          )} />
          {unread > 0 && <Button size="small" type="link" onClick={markAll}>{t('notif.mark_all')}</Button>}
        </>
      )}
    </div>
  );

  return (
    <Popover trigger="click" placement="bottomRight" open={open} onOpenChange={(v) => { setOpen(v); if (v) load(); }} title={t('notif.title')} content={content}>
      <Badge count={unread} size="small" overflowCount={99}>
        <Button type="text" aria-label={unread > 0 ? `${t('notif.title')} : ${unread} ${t('notif.unread')}` : t('notif.title')} icon={<BellOutlined />} style={compact ? { padding: '0 6px' } : undefined} />
      </Badge>
    </Popover>
  );
}
