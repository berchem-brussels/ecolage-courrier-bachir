/**
 * Aperçu d'une pièce (CDC CE-025, CE-124) : un PDF s'affiche dans le lecteur du navigateur, une image directement.
 * Le contenu est servi par une route authentifiée par le cookie de session ; aucun jeton dans l'adresse.
 * Boutons « Ouvrir dans un onglet » et « Télécharger » sous l'aperçu.
 */
import { Button, Empty, Space, Typography } from 'antd';
import { DownloadOutlined, ExportOutlined } from '@ant-design/icons';
import { pieceUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

export interface Piece {
  id: number; entity_id: number; entity_code: string; mail_id: number | null; mail_number: string | null; status: 'a_enregistrer' | 'rattachee' | 'rejetee';
  original_name: string; mime: 'application/pdf' | 'image/jpeg' | 'image/png'; size_bytes: number; sha256: string; position: number;
  reject_reason: string | null; created_by_first_name: string | null; created_by_last_name: string | null; created_at: string;
}

/** Taille lisible : ko ou Mo selon la langue. */
export function sizeLabel(bytes: number, t: (k: string) => string) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} ${t('unit.mb')}` : `${Math.max(1, Math.round(bytes / 1024))} ${t('unit.kb')}`;
}

export default function PieceViewer({ piece, height = '70vh' }: { piece: Piece | null; height?: string | number }) {
  const { t } = useI18n();
  if (!piece) return <Empty description={t('piece.none')} />;
  const url = pieceUrl(piece.id);
  return (
    <div>
      {piece.mime === 'application/pdf' ? (
        <iframe title={`${t('piece.viewer')} : ${piece.original_name}`} src={url}
          style={{ width: '100%', height, border: '1px solid var(--app-border-strong)', borderRadius: 6, background: 'var(--app-bg-subtle)' }} />
      ) : (
        <div style={{ maxHeight: height, overflow: 'auto', border: '1px solid var(--app-border-strong)', borderRadius: 6, background: 'var(--app-bg-subtle)', textAlign: 'center' }}>
          <img src={url} alt={`${t('piece.viewer')} : ${piece.original_name}`} style={{ maxWidth: '100%' }} />
        </div>
      )}
      <Space wrap style={{ marginTop: 8 }}>
        <Typography.Text type="secondary">{piece.original_name} · {sizeLabel(piece.size_bytes, t)}</Typography.Text>
        <Button size="small" icon={<ExportOutlined />} href={url} target="_blank" rel="noopener noreferrer">{t('piece.open')}</Button>
        <Button size="small" icon={<DownloadOutlined />} href={pieceUrl(piece.id, true)}>{t('piece.download')}</Button>
      </Space>
    </div>
  );
}
