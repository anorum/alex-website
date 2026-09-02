// Battle items and their shop prices. Pure data.

export interface ItemDef {
  id: string;
  name: string;
  price: number;
  effect: 'hp' | 'mp' | 'cure' | 'escape';
  amount: number;
  line: string;
  description: string;
}

export const items: ItemDef[] = [
  { id: 'coffee', name: 'COFFEE', price: 60, effect: 'mp', amount: 30, line: 'drinks COFFEE. MP restored.', description: 'Restores 30 MP.' },
  { id: 'runbook', name: 'RUNBOOK', price: 120, effect: 'hp', amount: 200, line: 'consults the RUNBOOK. HP restored.', description: 'Restores 200 HP.' },
  { id: 'patch', name: 'PATCH', price: 90, effect: 'cure', amount: 0, line: 'applies a PATCH. Statuses cleared.', description: 'Cures every status.' },
  { id: 'pager', name: 'PAGER', price: 200, effect: 'escape', amount: 0, line: 'gets paged and leaves.', description: 'Escape any random battle.' },
];

export function itemById(id: string): ItemDef | undefined {
  return items.find((i) => i.id === id);
}
