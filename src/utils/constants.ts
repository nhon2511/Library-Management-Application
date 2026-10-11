// ── Pagination defaults ────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// ── Business rule defaults (also stored in SystemSetting) ──
export const DEFAULTS = {
  MAX_BORROW_LIMIT: 5,
  RESERVATION_EXPIRY_HOURS: 24,
  MAX_RENEWALS: 2,
  RENEWAL_DAYS: 7,
  GRACE_PERIOD_DAYS: 1,
  OVERDUE_FINE_PER_DAY: 5000, // VNĐ
  FINE_CAP_PERCENTAGE: 1.5, // 150% of book price
  DAMAGE_LIGHT_PERCENTAGE: 0.2,
  DAMAGE_HEAVY_PERCENTAGE: 0.5,
  LOSS_PERCENTAGE: 1.0,
  LOSS_PROCESSING_FEE: 20000, // VNĐ
  UNPAID_FINE_THRESHOLD: 50000, // VNĐ
  OVERDUE_DAYS_THRESHOLD: 14,
  REMINDER_DAYS_BEFORE_DUE: 2,
} as const;

// ── Roles ──────────────────────────────────────
export const ROLES = {
  READER: 'READER',
  LIBRARIAN: 'LIBRARIAN',
  ADMIN: 'ADMIN',
} as const;
