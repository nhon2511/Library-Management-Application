import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}
export function Select(props: InputHTMLAttributes<HTMLSelectElement>) {
  return <select className="input" {...props} />;
}
export function Status({ value }: { value: string }) {
  const labels: Record<string, string> = {
    AVAILABLE: 'Có sẵn',
    RESERVED: 'Đã giữ',
    BORROWED: 'Đang mượn',
    DAMAGED: 'Hỏng',
    LOST: 'Mất',
    UNPAID: 'Chưa thu',
    PAID: 'Đã thu',
    WAIVED: 'Đã miễn',
    ACTIVE: 'Hoạt động',
    SUSPENDED: 'Tạm khóa',
    INACTIVE: 'Vô hiệu',
    RETURNED: 'Đã trả',
    OVERDUE: 'Quá hạn',
    GOOD: 'Tốt',
    LIGHT_DAMAGE: 'Hỏng nhẹ',
    HEAVY_DAMAGE: 'Hỏng nặng',
  };
  return <span className={`status status-${value.toLowerCase()}`}>{labels[value] || value}</span>;
}
export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error' | 'success';
  children: ReactNode;
}) {
  return (
    <div className={`notice notice-${tone}`} role="status">
      {children}
    </div>
  );
}
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-mark">—</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
export function LoadingState({ label = 'Đang tải dữ liệu' }: { label?: string }) {
  return (
    <div className="loading-state" aria-live="polite">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
      <span>{label}</span>
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <Notice tone="error">
      <strong>Không thể hoàn tất</strong>
      <br />
      {message}
      <br />
      <Button variant="secondary" onClick={retry}>
        Thử lại
      </Button>
    </Notice>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-btn" aria-label="Đóng" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
