/**
 * Administration › Paramètres (standard v3.2, section 17.3) : réglages de l'instance qui s'appliquent sans nouvelle
 * version. Version 0.2.0 : taille maximale d'un fichier déposé (décision D-23 du 20/10/2026, 50 Mo au plus, plafond
 * technique de nginx) et taille maximale d'un fichier lu par un assistant (MCP). Chaque changement est journalisé.
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, InputNumber, Typography, message } from 'antd';
import api, { ApiError } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';

interface Settings { pieces_max_mb: number; pieces_mcp_read_max_mb: number; defaults?: { pieces_max_mb: number; pieces_mcp_read_max_mb: number } }

export default function SettingsPage() {
  const { t } = useI18n();
  const { reload } = useSettings();
  const [form] = Form.useForm();
  const [data, setData] = useState<Settings | null>(null);

  useEffect(() => {
    api.get<Settings>('/settings').then((s) => { setData(s); form.setFieldsValue(s); }).catch((e) => message.error(e instanceof ApiError ? e.message : t('common.error')));
  }, [form, t]);

  const save = async (v: Settings) => {
    try {
      const s = await api.put<Settings>('/settings', { pieces_max_mb: v.pieces_max_mb, pieces_mcp_read_max_mb: v.pieces_mcp_read_max_mb });
      setData(s);
      await reload();
      message.success(t('common.saved'));
    } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); }
  };

  const def = (k: 'pieces_max_mb' | 'pieces_mcp_read_max_mb') => (data?.defaults ? `${t('settings.default')} ${data.defaults[k]} ${t('unit.mb')}` : undefined);
  return (
    <div>
      <Typography.Title level={1} style={{ fontSize: 22, marginBottom: 16 }}>{t('settings.title')}</Typography.Title>
      <Card title={t('settings.pieces')} style={{ maxWidth: 720 }}>
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('settings.pieces.help')} />
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="pieces_max_mb" label={`${t('settings.max_mb')} (${t('unit.mb')})`} extra={def('pieces_max_mb')} rules={[{ required: true }]}>
            <InputNumber min={1} max={50} precision={0} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="pieces_mcp_read_max_mb" label={`${t('settings.mcp_read_max_mb')} (${t('unit.mb')})`} extra={def('pieces_mcp_read_max_mb')} rules={[{ required: true }]}>
            <InputNumber min={1} max={10} precision={0} style={{ width: 160 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">{t('common.save')}</Button>
        </Form>
      </Card>
    </div>
  );
}
