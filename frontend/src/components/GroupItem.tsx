/**
 * Champ à groupe de boutons ou de cases (standard v3.3, section 12, E23) : le titre n'est pas un élément <label> sans champ associé,
 * que Chrome signale (« No label associated with a form field »), mais le nom du groupe : role="group" et aria-labelledby.
 * Même aspect que Form.Item : astérisque des champs obligatoires, icône « ? » d'explication, message d'erreur, texte d'aide.
 */
import { useId, type ReactNode } from 'react';
import { Form, Tooltip } from 'antd';
import type { Rule } from 'antd/es/form';
import { QuestionCircleOutlined } from '@ant-design/icons';

export interface GroupItemProps { name: string; label: ReactNode; tooltip: string; rules?: Rule[]; extra?: ReactNode; children: ReactNode }

export default function GroupItem({ name, label, tooltip, rules, extra, children }: GroupItemProps) {
  const id = useId();
  const required = (rules || []).some((r) => typeof r === 'object' && 'required' in r && !!r.required);
  return (
    <div role="group" aria-labelledby={id} className="group-item">
      <div id={id} className="group-item-label">
        {required && <span className="group-item-required" aria-hidden="true">*</span>}
        {label}
        <Tooltip title={tooltip}><QuestionCircleOutlined className="group-item-help" /></Tooltip>
      </div>
      <Form.Item name={name} rules={rules} extra={extra}>{children}</Form.Item>
    </div>
  );
}
