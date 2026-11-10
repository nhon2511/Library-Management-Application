import { z } from 'zod';
import { DEFAULTS } from '../../utils/constants';

export const settingKeys = Object.keys(DEFAULTS) as [
  keyof typeof DEFAULTS,
  ...(keyof typeof DEFAULTS)[],
];
export const settingKeySchema = z.object({ key: z.enum(settingKeys) });
export const updateSettingSchema = z.object({
  value: z.number().finite().nonnegative().max(2_000_000_000),
  description: z.string().trim().max(500).optional(),
});

export type SettingKey = keyof typeof DEFAULTS;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
