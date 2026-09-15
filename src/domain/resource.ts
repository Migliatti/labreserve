export type ResourceCategory = 'LABORATORY' | 'EQUIPMENT';
export type ResourceStatus = 'OPERATIONAL' | 'UNAVAILABLE';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  status: ResourceStatus;
}
