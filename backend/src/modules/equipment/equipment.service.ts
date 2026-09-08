import { Op } from 'sequelize';
import { Equipment } from '../../models/index.js';
import { NotFoundError } from '../../lib/errors.js';
import { buildOffsetPage, type OffsetPage } from '../../lib/pagination.js';
import type {
  CreateEquipmentInput,
  ListEquipmentQuery,
  UpdateEquipmentInput,
} from './equipment.schemas.js';

/**
 * Equipment uses offset pagination: the list is small, stable and the UI wants
 * page numbers and a total. Cleaning records — append-heavy and unbounded — use
 * keyset pagination instead (see NOTES.md).
 */
export async function listEquipment(query: ListEquipmentQuery): Promise<OffsetPage<Equipment>> {
  const { page, pageSize, status, search } = query;

  const { rows, count } = await Equipment.findAndCountAll({
    where: {
      ...(status && { status }),
      ...(search && {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ],
      }),
    },
    order: [
      ['name', 'ASC'],
      ['id', 'ASC'],
    ],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return buildOffsetPage(rows, count, page, pageSize);
}

export async function getEquipmentOrFail(id: string): Promise<Equipment> {
  const equipment = await Equipment.findByPk(id);
  if (!equipment) throw new NotFoundError('Equipment');
  return equipment;
}

export async function createEquipment(input: CreateEquipmentInput): Promise<Equipment> {
  return Equipment.create(input);
}

export async function updateEquipment(
  id: string,
  input: UpdateEquipmentInput,
): Promise<Equipment> {
  const equipment = await getEquipmentOrFail(id);
  return equipment.update(input);
}

/** Cleaning records cascade with the equipment (see the FK in migration 001). */
export async function deleteEquipment(id: string): Promise<void> {
  const equipment = await getEquipmentOrFail(id);
  await equipment.destroy();
}
