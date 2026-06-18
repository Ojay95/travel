import Dexie, { Table } from 'dexie';
import { VacationPlan } from '../types';

export interface LocalPlan extends VacationPlan {
  userId?: string;
  userEmail?: string;
  syncStatus: 'synced' | 'pending-save' | 'pending-delete';
  localUpdatedAt: number;
}

export class AventurDatabase extends Dexie {
  plans!: Table<LocalPlan, string>;

  constructor() {
    super('AventurDatabase');
    this.version(1).stores({
      plans: 'id, userId, userEmail, syncStatus, localUpdatedAt'
    });
  }
}

export const db = new AventurDatabase();
