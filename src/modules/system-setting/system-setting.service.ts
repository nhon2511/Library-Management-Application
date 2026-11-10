import prisma from '../../config/database';
import { DEFAULTS } from '../../utils/constants';
import { BadRequestError } from '../../utils/api-error';
import { SettingKey, UpdateSettingInput } from './system-setting.schema';
import { Prisma } from '@prisma/client';

export class SystemSettingService {
  private isSafeValue(key: SettingKey, value: number): boolean {
    const maximums: Partial<Record<SettingKey, number>> = {
      MAX_BORROW_LIMIT: 100,
      LOAN_DAYS: 365,
      RESERVATION_EXPIRY_HOURS: 168,
      MAX_RENEWALS: 20,
      RENEWAL_DAYS: 365,
      GRACE_PERIOD_DAYS: 365,
      OVERDUE_DAYS_THRESHOLD: 3650,
      REMINDER_DAYS_BEFORE_DUE: 365,
    };
    const integralKeys = new Set<SettingKey>([
      'MAX_BORROW_LIMIT',
      'LOAN_DAYS',
      'RESERVATION_EXPIRY_HOURS',
      'MAX_RENEWALS',
      'RENEWAL_DAYS',
      'GRACE_PERIOD_DAYS',
      'OVERDUE_FINE_PER_DAY',
      'LOSS_PROCESSING_FEE',
      'UNPAID_FINE_THRESHOLD',
      'OVERDUE_DAYS_THRESHOLD',
      'REMINDER_DAYS_BEFORE_DUE',
    ]);
    if (!Number.isFinite(value) || value < 0 || value > 2_000_000_000) return false;
    if (maximums[key] !== undefined && value > maximums[key]!) return false;
    if (integralKeys.has(key) && !Number.isInteger(value)) return false;
    if (key.endsWith('PERCENTAGE') && value > 2) return false;
    if (key === 'OVERDUE_FINE_PER_DAY' && value > 1_000_000) return false;
    if (key === 'LOSS_PROCESSING_FEE' && value > 100_000_000) return false;
    if (
      ['MAX_BORROW_LIMIT', 'LOAN_DAYS', 'RESERVATION_EXPIRY_HOURS', 'RENEWAL_DAYS'].includes(key) &&
      value === 0
    )
      return false;
    return true;
  }

  async getRules(tx?: Prisma.TransactionClient): Promise<Record<SettingKey, number>> {
    const stored = await (tx ?? prisma).systemSetting.findMany({
      select: { key: true, value: true },
    });
    const rules = { ...DEFAULTS } as Record<SettingKey, number>;
    for (const setting of stored) {
      if (Object.prototype.hasOwnProperty.call(rules, setting.key)) {
        const value = Number(setting.value);
        const key = setting.key as SettingKey;
        if (this.isSafeValue(key, value)) rules[key] = value;
      }
    }
    return rules;
  }
  async findAll() {
    const stored = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    return Object.entries(DEFAULTS).map(([key, defaultValue]) => {
      const item = stored.find((setting) => setting.key === key);
      return {
        key,
        value: item ? Number(item.value) : defaultValue,
        description: item?.description ?? null,
        dataType: 'number',
        isDefault: !item,
      };
    });
  }

  async update(key: SettingKey, input: UpdateSettingInput, actorId: string) {
    if (!this.isSafeValue(key, input.value))
      throw new BadRequestError('Giá trị cài đặt không hợp lệ');
    return prisma.$transaction(async (tx) => {
      const previous = await tx.systemSetting.findUnique({ where: { key } });
      const setting = await tx.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value: String(input.value),
          dataType: 'number',
          description: input.description,
        },
        update: { value: String(input.value), description: input.description },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'UPDATE_SYSTEM_SETTING',
          entity: 'SystemSetting',
          entityId: setting.id,
          details: { key, previousValue: previous?.value ?? DEFAULTS[key], newValue: input.value },
        },
      });
      return setting;
    });
  }
}

export const systemSettingService = new SystemSettingService();
