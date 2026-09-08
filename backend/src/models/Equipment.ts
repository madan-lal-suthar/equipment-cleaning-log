import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export const EQUIPMENT_STATUSES = ['active', 'retired'] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export class Equipment extends Model<InferAttributes<Equipment>, InferCreationAttributes<Equipment>> {
  declare id: CreationOptional<string>;
  declare name: string;
  /** Human-facing asset tag, unique across the plant (e.g. "MX-1000"). */
  declare code: string;
  declare status: CreationOptional<EquipmentStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Equipment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM(...EQUIPMENT_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'equipment', modelName: 'Equipment' },
);
