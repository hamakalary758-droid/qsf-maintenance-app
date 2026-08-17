import { FAILURE_TYPES } from './failureTypes';

export interface EquipmentTemplate {
  id: string;
  label: string; // shown in the dropdown
  shutdownName?: string;
  equipmentName: string;
  equipmentCode: string;
  location: string;
  failureType: string; // must be one of FAILURE_TYPES
}

export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [];
