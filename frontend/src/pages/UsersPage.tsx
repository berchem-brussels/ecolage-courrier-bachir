/** Comptes de l'application, réservés à l'administrateur (standard v3.2, section 17.4). Remplacé à terme par l'application Droits. */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Checkbox, Form, Input, Modal, Popconfirm, Radio, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { ApiError, qs } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { useAuth, type EntityRole } from '../contexts/AuthContext';
import { useEntities } from '../hooks';
import { NO_FOR, pick, type Entity } from '../labels';

interface U { id: number; email: string; first_name: string; last_name: string; user_role: 'agent' | 'admin'; preferred_lang: 'fr' | 'nl'; is_active: number; entity_roles: EntityRole[] }
type RoleChoice = EntityRole['role'] | '';
const ROLES: EntityRole['role'][] = ['agent', 'chef_service', 'secretariat', 'gestionnaire', 'auditeur'];

/** Un choix exclusif par entité, en boutons (standard v3.2, section 12.4) ; « Aucun » retire le rôle. */
function EntityRolesInput({ entities, value, onChange }: { entities: Entity[]; value?: Record<number, RoleChoice>; onChange?: (v: Record<number, RoleChoice>) => void }) {
  const { t, lang } = useI18n();
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {entities.map((e) => (
        <div key={e.id}>
          <Typography.Text strong>{e.code} · {pick(e, 'name', lang)}</Typography.Text>
          <div style={{ marginTop: 4 }}>
            <Radio.Group size="small" optionType="button" aria-label={`${t('users.entity_roles')} ${e.code}`} value={value?.[e.id] || ''}
              onChange={(ev) => onChange?.({ ...(value || {}), [e.id]: ev.target.value })}
              options={[{ value: '', label: t('role.none') }, ...ROLES.map((r) => ({ value: r, label: t(`role.${r}`) }))]} />
          </div>
        </div>
      ))}
    </Space>
  );
}

const toMap = (roles: EntityRole[]) => Object.fromEntries(roles.map((r) => [r.entity_id, r.role])) as Record<number, RoleChoice>;
const toList = (m: Record<number, RoleChoice> | undefined) => Object.entries(m || {}).filter(([, r]) => r).map(([id, role]) => ({ entity_id: Number(id), role }));

export default function UsersPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<U[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { user: me, refresh } = useAuth();
  const [rolesFor, setRolesFor] = useState<U | null>(null);
  const [rolesValue, setRolesValue] = useState<Record<number, RoleChoice>>({});
  const entities = useEntities();
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await api.page<U>(`/users${qs({ limit: 200 })}`)).data); } catch (e) { fail(e); } finally { setLoading(false); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const mode = Form.useWatch('password_mode', form);

  const create = async (v: Omit<U, 'id' | 'is_active' | 'entity_roles'> & { password_mode: 'generated' | 'manual'; password?: string; must_change_password: boolean; roles?: Record<number, RoleChoice> }) => {
    const { roles, ...rest } = v;
    try {
      const r = await api.post<U & { generated_password?: string }>('/users', { ...rest, entity_roles: toList(roles) });
      form.resetFields();
      load();
      if (r.generated_password) setGeneratedPassword(r.generated_password);
      else { setOpen(false); message.success(t('common.saved')); }
    } catch (e) { fail(e); }
  };

  const setRole = async (u: U, user_role: U['user_role']) => { try { await api.put(`/users/${u.id}`, { user_role }); load(); } catch (e) { fail(e); } };
  const saveRoles = async () => {
    if (!rolesFor) return;
    try {
      await api.put(`/users/${rolesFor.id}`, { entity_roles: toList(rolesValue) });
      // Ses propres rôles changent le menu : on relit le profil sans attendre un rechargement de la page.
      if (rolesFor.id === me?.id) await refresh();
      setRolesFor(null); message.success(t('common.saved')); load();
    } catch (e) { fail(e); }
  };
  const deactivate = async (u: U) => { try { await api.del(`/users/${u.id}`); load(); } catch (e) { fail(e); } };

  const roleOptions = [{ value: 'agent', label: t('users.role.agent') }, { value: 'admin', label: t('users.role.admin') }];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0 }}>{t('users.title')}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setGeneratedPassword(null); setOpen(true); }}>{t('common.create')}</Button>
      </div>
      <Card>
        <Table<U> rowKey="id" size="middle" loading={loading} dataSource={rows} scroll={{ x: 'max-content' }} locale={{ emptyText: t('common.nodata') }}
          columns={[
            { title: t('users.field.last_name'), key: 'name', render: (_, u) => `${u.last_name} ${u.first_name}` },
            { title: t('users.field.email'), dataIndex: 'email', key: 'email' },
            { title: t('users.entity_roles'), key: 'eroles', render: (_, u) => (
              <Space size={4} wrap>
                {u.entity_roles.map((r) => <Tag key={r.entity_id}>{r.entity_code} · {t(`role.${r.role}`)}</Tag>)}
                {u.is_active ? <Button size="small" type="link" onClick={() => { setRolesFor(u); setRolesValue(toMap(u.entity_roles)); }}>{t('users.edit_roles')}</Button> : null}
              </Space>
            ) },
            { title: t('users.app_role'), key: 'role', render: (_, u) => (
              <Radio.Group size="small" optionType="button" value={u.user_role} options={roleOptions} disabled={!u.is_active} onChange={(e) => setRole(u, e.target.value)} />
            ) },
            { title: t('users.field.active'), key: 'active', render: (_, u) => (u.is_active ? <Tag color="green">{t('yes')}</Tag> : <Tag>{t('no')}</Tag>) },
            { title: t('common.actions'), key: 'actions', render: (_, u) => (u.is_active ? (
              <Popconfirm title={t('users.deactivate.confirm')} okText={t('yes')} cancelText={t('no')} onConfirm={() => deactivate(u)}>
                <Button size="small" danger>{t('users.deactivate')}</Button>
              </Popconfirm>
            ) : null) },
          ]} />
      </Card>
      <Modal open={open} title={t('users.new')} okText={generatedPassword ? t('common.close') : t('common.save')} cancelText={t('common.cancel')}
        cancelButtonProps={{ style: generatedPassword ? { display: 'none' } : undefined }}
        onOk={() => (generatedPassword ? setOpen(false) : form.submit())} onCancel={() => setOpen(false)}>
        {generatedPassword ? (
          <Alert type="warning" showIcon message={t('users.generated')} description={<Typography.Text copyable code>{generatedPassword}</Typography.Text>} />
        ) : (
          <Form form={form} layout="vertical" onFinish={create} initialValues={{ user_role: 'agent', preferred_lang: 'fr', password_mode: 'generated', must_change_password: false }}>
            <Form.Item name="email" label={t('users.field.email')} rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
            <Form.Item name="first_name" label={t('users.field.first_name')} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="last_name" label={t('users.field.last_name')} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item {...NO_FOR} name="roles" label={t('users.entity_roles')} extra={t('users.entity_roles.help')}><EntityRolesInput entities={entities} /></Form.Item>
            <Form.Item {...NO_FOR} name="user_role" label={t('users.app_role')}><Radio.Group aria-label={t('users.app_role')} optionType="button" options={roleOptions} /></Form.Item>
            <Form.Item {...NO_FOR} name="preferred_lang" label={t('users.field.lang')}><Radio.Group aria-label={t('users.field.lang')} optionType="button" options={[{ value: 'fr', label: 'FR' }, { value: 'nl', label: 'NL' }]} /></Form.Item>
            {/* Modèle Microsoft 365 (standard v3.2, section 8.1) */}
            <Form.Item {...NO_FOR} name="password_mode" label={t('users.password.mode')}>
              <Radio.Group aria-label={t('users.password.mode')} optionType="button" options={[{ value: 'generated', label: t('users.password.generated') }, { value: 'manual', label: t('users.password.manual') }]} />
            </Form.Item>
            {mode === 'manual' && (
              <Form.Item name="password" label={t('users.password.value')} rules={[{ required: true, min: 8 }]}><Input.Password autoComplete="new-password" /></Form.Item>
            )}
            <Form.Item name="must_change_password" valuePropName="checked"><Checkbox>{t('users.password.must_change')}</Checkbox></Form.Item>
          </Form>
        )}
      </Modal>
      <Modal open={!!rolesFor} title={rolesFor ? `${t('users.edit_roles')} : ${rolesFor.first_name} ${rolesFor.last_name}` : ''} okText={t('common.save')} cancelText={t('common.cancel')}
        onOk={saveRoles} onCancel={() => setRolesFor(null)} destroyOnClose>
        <Typography.Paragraph type="secondary">{t('users.entity_roles.help')}</Typography.Paragraph>
        <EntityRolesInput entities={entities} value={rolesValue} onChange={setRolesValue} />
      </Modal>
    </div>
  );
}
