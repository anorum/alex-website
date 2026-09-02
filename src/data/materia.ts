// Every spell and trick. Pure data - no React, no DOM.

export type Element = 'fire' | 'ice' | 'lightning' | 'earth' | 'none';
export type StatusId = 'poison' | 'slow' | 'haste' | 'silence' | 'atkDown' | 'defDown' | 'atkUp';
export type TargetKind = 'enemy' | 'enemies' | 'ally' | 'self' | 'party';

export interface MateriaDef {
  id: string;
  name: string;
  owner: 'alex' | 'mara';
  kind: 'damage' | 'heal' | 'status' | 'cure' | 'scan' | 'fetch';
  element: Element;
  /** damage base or heal amount; 0 for utility */
  power: number;
  mpCost: number;
  target: TargetKind;
  /** status applied on hit, with chance 0..1 */
  status?: { id: StatusId; chance: number; turns: number };
  line: string;
}

export const materia: MateriaDef[] = [
  { id: 'snowflake-storm', name: 'SNOWFLAKE STORM', owner: 'alex', kind: 'damage', element: 'ice', power: 34, mpCost: 6, target: 'enemy', line: 'ALEX casts SNOWFLAKE STORM.' },
  { id: 'airflow-gale', name: 'AIRFLOW GALE', owner: 'alex', kind: 'damage', element: 'lightning', power: 30, mpCost: 5, target: 'enemy', line: 'ALEX summons AIRFLOW GALE.' },
  { id: 'dbt-transform', name: 'DBT TRANSFORM', owner: 'alex', kind: 'status', element: 'none', power: 0, mpCost: 5, target: 'self', status: { id: 'atkUp', chance: 1, turns: 4 }, line: 'ALEX refactors with DBT. Tests pass.' },
  { id: 'terraform-quake', name: 'TERRAFORM QUAKE', owner: 'alex', kind: 'damage', element: 'earth', power: 40, mpCost: 10, target: 'enemies', line: 'ALEX casts TERRAFORM QUAKE.' },
  { id: 'scan', name: 'SCAN', owner: 'alex', kind: 'scan', element: 'none', power: 0, mpCost: 1, target: 'enemy', line: 'ALEX runs SCAN.' },
  { id: 'haste', name: 'HASTE', owner: 'alex', kind: 'status', element: 'none', power: 0, mpCost: 8, target: 'ally', status: { id: 'haste', chance: 1, turns: 4 }, line: 'ALEX casts HASTE.' },
  { id: 'rollback', name: 'ROLLBACK', owner: 'alex', kind: 'heal', element: 'none', power: 120, mpCost: 7, target: 'ally', line: 'ALEX runs ROLLBACK.' },
  { id: 'runbook-ritual', name: 'RUNBOOK RITUAL', owner: 'alex', kind: 'cure', element: 'none', power: 0, mpCost: 6, target: 'party', line: 'ALEX follows the RUNBOOK. Statuses cleared.' },
  { id: 'bark', name: 'BARK', owner: 'mara', kind: 'status', element: 'none', power: 0, mpCost: 2, target: 'enemy', status: { id: 'atkDown', chance: 1, turns: 3 }, line: 'MARA barks. The enemy hesitates.' },
  { id: 'fetch', name: 'FETCH', owner: 'mara', kind: 'fetch', element: 'none', power: 0, mpCost: 3, target: 'self', line: 'MARA runs off and comes back with something.' },
  { id: 'growl', name: 'GROWL', owner: 'mara', kind: 'status', element: 'none', power: 0, mpCost: 2, target: 'enemy', status: { id: 'defDown', chance: 1, turns: 3 }, line: 'MARA growls.' },
  { id: 'lick', name: 'LICK', owner: 'mara', kind: 'heal', element: 'none', power: 70, mpCost: 3, target: 'ally', line: 'MARA licks a wound. It helps.' },
  { id: 'dig', name: 'DIG', owner: 'mara', kind: 'damage', element: 'earth', power: 36, mpCost: 4, target: 'enemy', line: 'MARA digs furiously.' },
];

export function materiaById(id: string): MateriaDef | undefined {
  return materia.find((m) => m.id === id);
}
