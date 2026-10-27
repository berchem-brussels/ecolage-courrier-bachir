/**
 * File « À enregistrer » d'une entité (CDC CE-020, CE-025, CE-120 en partie) : le secrétariat y dépose les scans,
 * voit chaque fichier en aperçu à côté du formulaire d'enregistrement et passe au suivant sans revenir à la liste.
 * L'enregistrement joint le fichier au numéro attribué ; un fichier déposé par erreur se rejette avec un motif.
 * Version 0.2.0 : la file ne se remplit que par dépôt à l'écran (boîtes partagées et copieurs à l'étape 12).
 * Version 0.2.1 : l'annonce « Courrier enregistré avec son fichier » s'efface au dépôt suivant et au rejet d'un fichier.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Collapse, Grid, Input, Modal, Row, Space, Table, Typography, message } from 'antd';
import { LeftOutlined, RightOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import { registerRoles, useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useEntities } from '../hooks';
import EntityChoice, { useEntityParam } from '../components/EntityChoice';
import PieceUpload from '../components/PieceUpload';
import PieceViewer, { sizeLabel, type Piece } from '../components/PieceViewer';
import RegistrationForm from '../components/RegistrationForm';

export default function InboxPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const entities = useEntities();
  const allowed = useMemo(() => entities.filter((e) => e.is_active && registerRoles(user).some((r) => r.entity_id === e.id)), [entities, user]);
  const entity = useEntityParam(allowed);
  // Sous 768 px, les flèches restent sur une ligne et « Rejeter » ne garde que son icône (libellé accessible conservé).
  const narrow = Grid.useBreakpoint().md === false;
  const [queue, setQueue] = useState<Piece[]>([]);
  const [index, setIndex] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(async (keepId?: number) => {
    if (!entity) return;
    try {
      const r = await api.page<Piece>(`/pieces${qs({ entity_id: entity.id, limit: 200 })}`);
      setQueue(r.data);
      setIndex((i) => {
        const at = keepId ? r.data.findIndex((p) => p.id === keepId) : -1;
        return at >= 0 ? at : Math.min(i, Math.max(0, r.data.length - 1));
      });
    } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); }
  }, [entity, t]);
  useEffect(() => { setIndex(0); load(); }, [load]);

  const current = queue[index] || null;

  const reject = async () => {
    if (!current || !reason.trim()) return;
    try {
      await api.del(`/pieces/${current.id}`, { reason: reason.trim() });
      message.success(t('piece.rejected'));
      setLast(null);
      setRejectOpen(false);
      setReason('');
      load();
    } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); }
  };

  if (allowed.length === 0) {
    return (<div><Typography.Title level={1} style={{ fontSize: 22 }}>{t('inbox.title')}</Typography.Title><Alert type="info" showIcon message={t('mail.norole')} /></div>);
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0, minWidth: 0 }}>{t('inbox.title')}{entity ? ` · ${entity.code}` : ''} ({queue.length})</Typography.Title>
        <EntityChoice allowed={allowed} value={entity} />
      </div>
      {entity && <div style={{ marginBottom: 16 }}><PieceUpload fields={{ entity_id: entity.id }} onSend={() => setLast(null)} onDone={(p) => { message.success(`${t('piece.received')} : ${p.original_name}`); load(current?.id); }} /></div>}
      {last && <Alert type="success" showIcon closable onClose={() => setLast(null)} style={{ marginBottom: 16 }} message={<span aria-live="polite" style={{ fontWeight: 600 }}>{t('inbox.registered')} {last}</span>} />}
      {queue.length === 0 ? (
        <Alert type="info" showIcon message={t('inbox.empty')} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card size="small" title={<Space wrap={false} size={8}>
              <Button aria-label={t('inbox.previous')} icon={<LeftOutlined />} disabled={index === 0} onClick={() => setIndex(index - 1)} />
              <span>{t('inbox.position')} {index + 1} / {queue.length}</span>
              <Button aria-label={t('inbox.next')} icon={<RightOutlined />} disabled={index >= queue.length - 1} onClick={() => setIndex(index + 1)} />
            </Space>} extra={<Button danger icon={<StopOutlined />} aria-label={t('piece.reject')} title={t('piece.reject')} onClick={() => setRejectOpen(true)}>{narrow ? null : t('piece.reject')}</Button>}>
              <PieceViewer piece={current} />
            </Card>
            <Collapse style={{ marginTop: 16 }} items={[{ key: 'list', label: `${t('inbox.list')} (${queue.length})`, children: (
              <Table size="small" rowKey="id" pagination={false} dataSource={queue}
                onRow={(p) => ({ onClick: () => setIndex(queue.findIndex((x) => x.id === p.id)), style: { cursor: 'pointer', fontWeight: p.id === current?.id ? 600 : undefined } })}
                columns={[
                  { title: t('piece.name'), dataIndex: 'original_name', key: 'name', ellipsis: true },
                  { title: t('piece.size'), dataIndex: 'size_bytes', key: 'size', render: (b: number) => sizeLabel(b, t) },
                  { title: t('piece.deposited'), dataIndex: 'created_at', key: 'at', render: (d: string) => dayjs.utc(d).local().format('L LT') },
                  { title: t('piece.by'), key: 'by', render: (_: unknown, p: Piece) => `${p.created_by_first_name || ''} ${p.created_by_last_name || ''}` },
                ]} />
            ) }]} />
          </Col>
          <Col xs={24} lg={10}>
            <Card title={t('inbox.form')}>
              {entity && current && (
                <RegistrationForm entity={entity} pieceIds={[current.id]} saveLabel={t('inbox.save')}
                  onSaved={(m) => { setLast(m.number); load(); }} />
              )}
            </Card>
          </Col>
        </Row>
      )}
      <Modal open={rejectOpen} title={t('piece.reject')} okText={t('piece.reject')} cancelText={t('common.cancel')} okButtonProps={{ danger: true, disabled: !reason.trim() }}
        onOk={reject} onCancel={() => { setRejectOpen(false); setReason(''); }}>
        <Typography.Paragraph>{t('piece.reject.help')}</Typography.Paragraph>
        <Input.TextArea rows={2} aria-label={t('common.reason')} placeholder={t('common.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </div>
  );
}
