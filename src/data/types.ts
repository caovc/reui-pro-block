export interface BlockMeta {
  id: string;
  name: string;
  description?: string;
  category: string;
  group: string;
  reference: string;
  index: number;
}
export interface CategoryMeta {
  id: string;
  name: string;
  group: string;
  groupLabel: string;
  reference: string;
  count: number;
  blocks: BlockMeta[];
}
export interface BlockProps {
  block: BlockMeta;
}
