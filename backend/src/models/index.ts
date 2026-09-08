import { sequelize } from '../db/sequelize.js';
import { AuditLog } from './AuditLog.js';
import { CleaningRecord } from './CleaningRecord.js';
import { Equipment } from './Equipment.js';
import { User } from './User.js';

Equipment.hasMany(CleaningRecord, {
  foreignKey: 'equipmentId',
  as: 'cleaningRecords',
  onDelete: 'CASCADE',
});
CleaningRecord.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

export { sequelize, AuditLog, CleaningRecord, Equipment, User };
export * from './AuditLog.js';
export * from './CleaningRecord.js';
export * from './Equipment.js';
