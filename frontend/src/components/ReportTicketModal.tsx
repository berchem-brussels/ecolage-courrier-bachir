/**
 * Formulaire « Signaler » (standard v3.3, section 13.5), ouvert depuis l'en-tête de chaque écran.
 * Le contexte (écran, version, langue, navigateur, date, dernière erreur de l'API) est joint sans saisie.
 * Adaptations à courrier : l'entité du demandeur (choix seulement avec des rôles dans deux entités) ; aucune capture sur les
 * écrans qui affichent du courrier (RGPD by design, décision du 03/11/2026).
 */
import { useState } from 'react';
import { Alert, Form, Input, Modal, Radio, Typography, message } from 'antd';
import { useLocation } from 'react-router-dom';
import api, { ApiError, getLastApiError } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { screenForPath } from '../screens';
import { NO_FOR } from '../labels';

type TicketType = 'incident' | 'bug' | 'question' | 'wish';
const MAX = 2 * 1024 * 1024;

export default function ReportTicketModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const { t, lang, hint } = useI18n();
  const { settings } = useSettings();
  const { user } = useAuth();
  const location = useLocation();
  const [form] = Form.useForm();
  const [shot, setShot] = useState<string | null>(null);
  const [shotError, setShotError] = useState(false);
  const type: TicketType = Form.useWatch('type', form) || 'question';
  const screen = screenForPath(location.pathname);
  const screenName = screen ? t(screen.titleKey) : t('tickets.screen_other');
  const entities = [...new Map((user?.entity_roles || []).map((r) => [r.entity_id, r.entity_code])).entries()];
  const hasEntity = entities.length > 0;
  const askEntity = type === 'question' && entities.length > 1;

  const pick = (file?: File) => {
    setShotError(false);
    setShot(null);
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > MAX) { setShotError(true); return; }
    const reader = new FileReader();
    reader.onload = () => setShot(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async (v: Record<string, string | number>) => {
    try {
      const body: Record<string, unknown> = {
        ...v,
        screen: screen ? screen.id : 'other',
        // Chemin sans paramètres : jamais d'identifiant ni de numéro de courrier dans le contexte.
        context: { path: location.pathname, version: settings.version, lang, userAgent: navigator.userAgent, at: new Date().toISOString(), lastApiError: getLastApiError() },
      };
      if (!askEntity) delete body.entity_id;
      if (shot && !screen?.noCapture) body.screenshot = shot;
      const r = await api.post<{ reference: string }>('/tickets', body);
      message.success(`${t('tickets.sent')} ${r.reference}`);
      form.resetFields();
      setShot(null);
      onClose();
      onCreated?.();
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : t('common.error'));
    }
  };

  return (
    <Modal open={open} width={640} title={t('tickets.report')} okText={t('tickets.send')} cancelText={t('common.cancel')} onOk={() => form.submit()} onCancel={onClose} destroyOnClose>
      <Typography.Paragraph type="secondary">{t('tickets.screen_joined')} <strong>{screenName}</strong></Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={submit} initialValues={{ type: 'question', impact: 'person', urgency: 'annoying' }}>
        <Form.Item {...NO_FOR} name="type" label={t('tickets.field.type')} tooltip={hint('tickets.type')} extra={t(type === 'question' && hasEntity ? 'tickets.who.business' : 'tickets.who.it')}>
          <Radio.Group aria-label={t('tickets.field.type')} optionType="button" options={(['incident', 'bug', 'question', 'wish'] as const).map((x) => ({ value: x, label: t(`tickets.type.${x}`) }))} />
        </Form.Item>
        {askEntity && (
          <Form.Item {...NO_FOR} name="entity_id" label={t('tickets.field.entity')} tooltip={hint('tickets.entity')} rules={[{ required: true }]}>
            <Radio.Group aria-label={t('tickets.field.entity')} optionType="button" options={entities.map(([id, code]) => ({ value: id, label: code }))} />
          </Form.Item>
        )}
        <Form.Item name="title" label={t('tickets.field.title')} tooltip={hint('tickets.title')} rules={[{ required: true, max: 200 }]}><Input autoComplete="off" /></Form.Item>
        <Form.Item name="description" label={t('tickets.field.description')} tooltip={hint('tickets.description')}><Input.TextArea rows={3} autoComplete="off" /></Form.Item>
        {(type === 'incident' || type === 'bug') && (
          <>
            <Form.Item name="expected" label={t('tickets.field.expected')} tooltip={hint('tickets.expected')}><Input.TextArea rows={2} autoComplete="off" /></Form.Item>
            <Form.Item name="actual" label={t('tickets.field.actual')} tooltip={hint('tickets.actual')}><Input.TextArea rows={2} autoComplete="off" /></Form.Item>
          </>
        )}
        <Form.Item {...NO_FOR} name="impact" label={t('tickets.field.impact')} tooltip={hint('tickets.impact')}>
          <Radio.Group aria-label={t('tickets.field.impact')} optionType="button" options={(['person', 'service', 'organisation'] as const).map((x) => ({ value: x, label: t(`tickets.impact.${x}`) }))} />
        </Form.Item>
        <Form.Item {...NO_FOR} name="urgency" label={t('tickets.field.urgency')} tooltip={hint('tickets.urgency')}>
          <Radio.Group aria-label={t('tickets.field.urgency')} optionType="button" options={(['blocking', 'annoying', 'comfort'] as const).map((x) => ({ value: x, label: t(`tickets.urgency.${x}`) }))} />
        </Form.Item>
        {screen?.noCapture ? (
          <Alert type="info" showIcon message={t('tickets.no_capture')} />
        ) : (
          <Form.Item label={t('tickets.field.screenshot')} htmlFor="ticket-screenshot" tooltip={hint('tickets.screenshot')} extra={t('tickets.capture.warning')}>
            <input id="ticket-screenshot" name="screenshot" type="file" accept="image/png,image/jpeg" onChange={(e) => pick(e.target.files?.[0])} />
            {shotError && <Alert type="error" showIcon message={t('tickets.screenshot.too_big')} style={{ marginTop: 8 }} />}
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
