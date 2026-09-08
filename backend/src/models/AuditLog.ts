import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export const AUDIT_ACTIONS = ['create', 'update'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** One field-level change: `null` on `from` for a create. */
export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

/**
 * Append-only audit trail. Nothing in the app ever updates or deletes a row here;
 * that is the whole point of the table for a regulated environment.
 */
export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  declare id: CreationOptional<string>;
  declare entityType: string;
  declare entityId: string;
  declare action: AuditAction;
  declare changedById: string | null;
  /**
   * Snapshot of the actor's name at the time of the change. Denormalised on
   * purpose: renaming or deleting a user must not rewrite history.
   */
  declare changedByName: string;
  declare changedAt: CreationOptional<Date>;
  declare changes: FieldChange[];
}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    entityType: { type: DataTypes.STRING(60), allowNull: false },
    entityId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.ENUM(...AUDIT_ACTIONS), allowNull: false },
    changedById: { type: DataTypes.UUID, allowNull: true },
    changedByName: { type: DataTypes.STRING(120), allowNull: false },
    changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    changes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    modelName: 'AuditLog',
    timestamps: false,
  },
);
