/** Accueil de la personne connectée sans rôle de registre : ses rôles par entité et ce qu'ils permettent aujourd'hui. */
import { Alert, Card, Space, Tag, Typography } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

export default function HomePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const roles = user?.entity_roles || [];
  return (
    <div>
      <Typography.Title level={1} style={{ fontSize: 22, marginBottom: 16 }}>{t('home.title')}</Typography.Title>
      <Card title={t('home.roles')}>
        {roles.length === 0 ? <Alert type="info" showIcon message={t('home.noroles')} /> : (
          <Space direction="vertical">
            <Space wrap>{roles.map((r) => <Tag key={r.entity_id}>{r.entity_code} · {t(`role.${r.role}`)}</Tag>)}</Space>
            <Alert type="info" showIcon message={t('home.nomail')} />
          </Space>
        )}
      </Card>
    </div>
  );
}
