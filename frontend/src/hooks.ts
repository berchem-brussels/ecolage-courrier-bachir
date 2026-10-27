/** Petites listes de référence chargées par l'API, partagées par les écrans. */
import { useEffect, useState } from 'react';
import api, { qs } from './api';
import type { Entity } from './labels';

export function useEntities() {
  const [entities, setEntities] = useState<Entity[]>([]);
  useEffect(() => {
    let alive = true;
    api.page<Entity>(`/entities${qs({ limit: 50 })}`).then((r) => { if (alive) setEntities(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return entities;
}
