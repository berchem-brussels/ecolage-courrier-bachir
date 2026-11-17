/**
 * Ajout ou correction d'une question de la FAQ locale (standard v3.3, section 13.1) : réservé à l'administrateur et aux gestionnaires
 * du registre. Sert aussi à proposer un ticket résolu pour la FAQ : le texte du ticket préremplit le français, le néerlandais reste à écrire.
 */
import { useEffect } from 'react';
import { Alert, Form, Input, Modal, Select, message } from 'antd';
import api, { ApiError } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { TOPICS } from '../help';

export interface FaqValues { id?: number; topic_id?: string | null; question_fr?: string; question_nl?: string; answer_fr?: string; answer_nl?: string }

export default function FaqModal({ open, initial, onClose, onSaved }: { open: boolean; initial?: FaqValues; onClose: () => void; onSaved: () => void }) {
  const { t, hint } = useI18n();
  const [form] = Form.useForm();
  useEffect(() => {
    if (open) form.setFieldsValue({ topic_id: initial?.topic_id || '', question_fr: initial?.question_fr || '', question_nl: initial?.question_nl || '', answer_fr: initial?.answer_fr || '', answer_nl: initial?.answer_nl || '' });
  }, [open, initial, form]);
  const save = async (v: FaqValues) => {
    try {
      const body = { ...v, topic_id: v.topic_id || undefined };
      if (initial?.id) await api.put(`/faq/${initial.id}`, { ...body, topic_id: v.topic_id || '' });
      else await api.post('/faq', body);
      message.success(t('faq.saved'));
      onSaved();
      onClose();
    } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); }
  };
  return (
    <Modal open={open} width={640} title={t(initial?.id ? 'faq.edit.title' : 'help.faq.add')} okText={t('common.save')} cancelText={t('common.cancel')} onOk={() => form.submit()} onCancel={onClose} destroyOnClose>
      <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={t('faq.warning')} />
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="topic_id" label={t('faq.topic')} tooltip={hint('faq.topic')}>
          <Select options={[{ value: '', label: t('faq.topic.general') }, ...TOPICS.map((tp) => ({ value: tp.id, label: t(tp.titleKey) }))]} />
        </Form.Item>
        <Form.Item name="question_fr" label={t('faq.question_fr')} tooltip={hint('faq.question')} rules={[{ required: true, max: 300 }]}><Input autoComplete="off" /></Form.Item>
        <Form.Item name="question_nl" label={t('faq.question_nl')} tooltip={hint('faq.question')} rules={[{ required: true, max: 300 }]}><Input autoComplete="off" /></Form.Item>
        <Form.Item name="answer_fr" label={t('faq.answer_fr')} tooltip={hint('faq.answer')} rules={[{ required: true, max: 4000 }]}><Input.TextArea rows={3} autoComplete="off" /></Form.Item>
        <Form.Item name="answer_nl" label={t('faq.answer_nl')} tooltip={hint('faq.answer')} rules={[{ required: true, max: 4000 }]}><Input.TextArea rows={3} autoComplete="off" /></Form.Item>
      </Form>
    </Modal>
  );
}
