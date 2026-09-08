import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type ForeignKey, type NonAttribute } from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import { Equipment } from './Equipment.js';

export const CLEANING_STATUSES = ['pending', 'verified'] as const;
export type CleaningStatus = (typeof CLEANING_STATUSES)[number];

export class CleaningRecord extends Model<
  InferAttributes<CleaningRecord>,
  InferCreationAttributes<CleaningRecord>
> {
  declare id: CreationOptional<string>;
  declare equipmentId: ForeignKey<Equipment['id']>;
  /** Name of the operator who performed the cleaning. */
  declare cleanedBy: string;
  declare cleanedAt: Date;
  declare method: string;
  declare notes: string | null;
  declare status: CreationOptional<CleaningStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare equipment?: NonAttribute<Equipment>;
}

CleaningRecord.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    equipmentId: { type: DataTypes.UUID, allowNull: false },
    cleanedBy: { type: DataTypes.STRING(120), allowNull: false },
    cleanedAt: { type: DataTypes.DATE, allowNull: false },
    method: { type: DataTypes.STRING(120), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CLEANING_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'cleaning_records', modelName: 'CleaningRecord' },
);
