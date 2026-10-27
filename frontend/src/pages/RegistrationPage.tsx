/**
 * Enregistrement du courrier entrant en série, sans fichier (CDC CE-040 à CE-048). Le formulaire est commun avec la
 * file « À enregistrer » (components/RegistrationForm.tsx). Après chaque enregistrement : numéro affiché en grand,
 * formulaire prêt pour le suivant avec la même date et le même mode d'arrivée, compteur de la séance.
 */
import { useMemo, useState } from 'react';
import { Alert, Card, Col, Row, Tag, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { registerRoles, useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useEntities } from '../hooks';
import EntityChoice, { useEntityParam } from '../components/EntityChoice';
import RegistrationForm, { type SavedMail } from '../components/RegistrationForm';

export default function RegistrationPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const entities = useEntities();
  const allowed = useMemo(() => entities.filter((e) => e.is_active && registerRoles(user).some((r) => r.entity_id === e.id)), [entities, user]);
  const entity = useEntityParam(allowed);
  const [session, setSession] = useState<SavedMail[]>([]);

  if (allowed.length === 0) {
    return (<div><Typography.Title level={1} style={{ fontSize: 22 }}>{t('mail.register')}</Typography.Title><Alert type="info" showIcon message={t('mail.norole')} /></div>);
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0, minWidth: 0 }}>{t('mail.register')}</Typography.Title>
        <EntityChoice allowed={allowed} value={entity} />
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card>
            {entity && <RegistrationForm entity={entity} onSaved={(m) => setSession((s) => [m, ...s])} />}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('mail.session.count')}>
            <Typography.Title level={2} style={{ margin: 0, fontSize: 40 }}>{session.length}</Typography.Title>
            {session[0] && (
              <Alert style={{ marginTop: 16 }} type="success" showIcon icon={<CheckCircleOutlined />}
                message={<span style={{ fontSize: 20, fontWeight: 600 }} aria-live="polite">{session[0].number}</span>} description={t('mail.next')} />
            )}
            {session.length > 1 && (
              <div style={{ marginTop: 16 }}>
                <Typography.Text type="secondary">{t('mail.session.last')}</Typography.Text>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>{session.slice(1, 11).map((m) => <Tag key={m.id}>{m.number}</Tag>)}</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
