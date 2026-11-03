/** Affichage d'une fiche d'aide : rôle de l'écran, zones, capture, procédures, questions (code et FAQ locale). */
import { Collapse, Space, Tag, Typography } from 'antd';
import { roleKey, type HelpTopic, type L } from './types';
import RichText from './RichText';
import { useI18n } from '../contexts/I18nContext';

export interface LocalFaq { id: number; question_fr: string; question_nl: string; answer_fr: string; answer_nl: string }

export default function TopicView({ topic, localFaq = [], expanded = false, anchor = true }: { topic: HelpTopic; localFaq?: LocalFaq[]; expanded?: boolean; anchor?: boolean }) {
  const { t, lang } = useI18n();
  const tx = (l: L) => l[lang] || l.fr;
  const shotSrc = (id: string) => `/help/${lang}/${id}.jpg`;
  const procItems = topic.procedures.map((p, i) => ({
    key: String(i),
    label: tx(p.title),
    children: (
      <div>
        <Typography.Paragraph type="secondary"><RichText text={tx(p.when)} /></Typography.Paragraph>
        <ol>{p.steps.map((s, j) => <li key={j}><RichText text={tx(s)} /></li>)}</ol>
        <Typography.Paragraph><strong>{t('help.result')}</strong> <RichText text={tx(p.result)} /></Typography.Paragraph>
        {p.errors?.map((e, j) => (
          <Typography.Paragraph key={j}><strong>{t('help.problem')}</strong> <RichText text={tx(e.problem)} /> <RichText text={tx(e.solution)} /></Typography.Paragraph>
        ))}
        {p.shots?.map((s) => <img key={s} src={shotSrc(s)} alt={tx(topic.shots.find((x) => x.id === s)?.caption || { fr: '', nl: '' })} className="help-shot" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />)}
      </div>
    ),
  }));
  const faq = [
    ...topic.faq.map((f, i) => ({ key: `c${i}`, label: tx(f.q), children: <RichText text={tx(f.a)} /> })),
    ...localFaq.map((f) => ({ key: `l${f.id}`, label: lang === 'nl' ? f.question_nl : f.question_fr, children: lang === 'nl' ? f.answer_nl : f.answer_fr })),
  ];
  return (
    <div className="help-topic" id={anchor ? `help-${topic.id}` : undefined}>
      <Typography.Title level={2} style={{ fontSize: 18 }} id={anchor ? `help-title-${topic.id}` : undefined}>{t(topic.titleKey)}</Typography.Title>
      <Space wrap style={{ marginBottom: 8 }}>{topic.roles.map((r) => <Tag key={r}>{t(roleKey(r))}</Tag>)}</Space>
      <Typography.Paragraph><RichText text={tx(topic.purpose)} /></Typography.Paragraph>
      {topic.overviewShot && <img src={shotSrc(topic.overviewShot)} alt={t(topic.titleKey)} className="help-shot" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />}
      <ul>{topic.layout.map((l, i) => <li key={i}><RichText text={tx(l)} /></li>)}</ul>
      <Typography.Title level={3} style={{ fontSize: 15 }}>{t('help.procedures')}</Typography.Title>
      <Collapse items={procItems} defaultActiveKey={expanded ? procItems.map((p) => p.key) : []} />
      {faq.length > 0 && (
        <>
          <Typography.Title level={3} style={{ fontSize: 15, marginTop: 16 }}>{t('help.faq')}</Typography.Title>
          <Collapse items={faq} defaultActiveKey={expanded ? faq.map((f) => f.key) : []} />
        </>
      )}
    </div>
  );
}
