/**
 * Dépôt de fichiers par glisser-déposer ou par sélection (CDC CE-020). Un envoi par fichier, par api.ts, avec le jeton
 * anti-CSRF. La taille est contrôlée à l'écran avant l'envoi, puis par le serveur, qui contrôle aussi le type réel.
 * Un fichier refusé reste affiché avec la raison du refus jusqu'à ce que la personne ferme la liste (CE-030).
 * onSend prévient l'écran qu'un dépôt commence (la file efface alors l'annonce du dernier enregistrement).
 */
import { useState } from 'react';
import { Alert, Upload, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import api, { ApiError } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import type { Piece } from './PieceViewer';

interface Refused { name: string; reason: string }

export default function PieceUpload({ fields, onDone, onSend, compact = false }: { fields: Record<string, number>; onDone: (p: Piece) => void; onSend?: () => void; compact?: boolean }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const maxMb = Number(settings.pieces?.max_mb || 50);
  const [refused, setRefused] = useState<Refused[]>([]);
  const [busy, setBusy] = useState(0);

  const send = async (file: File) => {
    onSend?.();
    if (file.size > maxMb * 1024 * 1024) {
      setRefused((r) => [...r, { name: file.name, reason: `${t('piece.too_large')} ${maxMb} ${t('unit.mb')}` }]);
      return;
    }
    setBusy((n) => n + 1);
    try {
      onDone(await api.upload<Piece>('/pieces', file, file.name, fields));
    } catch (e) {
      setRefused((r) => [...r, { name: file.name, reason: e instanceof ApiError ? e.message : t('common.error') }]);
    } finally { setBusy((n) => n - 1); }
  };

  return (
    <div>
      {/* Aucun filtre « accept » : le composant écarterait sans message un fichier d'un autre type (TIFF), avant tout envoi
          (défaut relevé à la recette de la 0.2.0). Tout fichier part au serveur, qui contrôle le type réel et rend la raison du refus. */}
      <Upload.Dragger multiple showUploadList={false}
        customRequest={({ file, onSuccess }) => { send(file as File).finally(() => onSuccess?.({})); }}
        style={{ padding: compact ? 4 : 12 }}>
        <p className="ant-upload-drag-icon" style={{ marginBottom: compact ? 4 : undefined }}><InboxOutlined /></p>
        <p className="ant-upload-text">{t(compact ? 'piece.add' : 'piece.drop')}</p>
        <p className="ant-upload-hint">{t('piece.types')} {maxMb} {t('unit.mb')}</p>
      </Upload.Dragger>
      {busy > 0 && <Typography.Text type="secondary" aria-live="polite">{t('piece.sending')} ({busy})</Typography.Text>}
      {refused.length > 0 && (
        <Alert type="error" showIcon closable onClose={() => setRefused([])} style={{ marginTop: 8 }} message={t('piece.refused')}
          description={<ul style={{ margin: 0, paddingLeft: 18 }}>{refused.map((r, i) => <li key={i}><strong>{r.name}</strong> : {r.reason}</li>)}</ul>} />
      )}
    </div>
  );
}
