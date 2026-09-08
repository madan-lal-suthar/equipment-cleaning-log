import { DataTypes, Sequelize, type QueryInterface } from 'sequelize';

/**
 * Initial schema: users, equipment, cleaning_records and the append-only audit_logs.
 * Columns are snake_case to match the `underscored: true` model convention.
 */
export async function up({ context }: { context: QueryInterface }): Promise<void> {
  await context.createTable('users', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });

  await context.createTable('equipment', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
    name: { type: DataTypes.STRING(160), allowNull: false },
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('active', 'retired'), allowNull: false, defaultValue: 'active' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });

  await context.createTable('cleaning_records', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'equipment', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    cleaned_by: { type: DataTypes.STRING(120), allowNull: false },
    cleaned_at: { type: DataTypes.DATE, allowNull: false },
    method: { type: DataTypes.STRING(120), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'verified'), allowNull: false, defaultValue: 'pending' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });

  // Backs the keyset pagination ordering (cleaned_at DESC, id DESC) per equipment.
  await context.addIndex('cleaning_records', {
    name: 'cleaning_records_equipment_id_cleaned_at_id_idx',
    fields: [
      'equipment_id',
      { name: 'cleaned_at', order: 'DESC' },
      { name: 'id', order: 'DESC' },
    ],
  });
  // Supports the `status` filter combined with the same ordering.
  await context.addIndex('cleaning_records', {
    name: 'cleaning_records_equipment_id_status_cleaned_at_idx',
    fields: ['equipment_id', 'status', { name: 'cleaned_at', order: 'DESC' }],
  });

  await context.createTable('audit_logs', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
    entity_type: { type: DataTypes.STRING(60), allowNull: false },
    entity_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.ENUM('create', 'update'), allowNull: false },
    changed_by_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    changed_by_name: { type: DataTypes.STRING(120), allowNull: false },
    changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    changes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  });

  await context.addIndex('audit_logs', {
    name: 'audit_logs_entity_changed_at_idx',
    fields: ['entity_type', 'entity_id', { name: 'changed_at', order: 'DESC' }],
  });
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
  await context.dropTable('audit_logs');
  await context.dropTable('cleaning_records');
  await context.dropTable('equipment');
  await context.dropTable('users');
  // Sequelize creates a Postgres type per ENUM column; dropTable leaves them behind.
  for (const type of [
    'enum_audit_logs_action',
    'enum_cleaning_records_status',
    'enum_equipment_status',
  ]) {
    await context.sequelize.query(`DROP TYPE IF EXISTS "${type}"`);
  }
}
