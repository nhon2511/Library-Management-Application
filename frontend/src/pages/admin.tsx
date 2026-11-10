import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { User, UserStatus } from '../lib/types';
import { Button, EmptyState, ErrorState, LoadingState } from '../components/ui';

type Setting = { key: string; value: number; description: string | null; isDefault: boolean };

export function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<{ name: string; dataUrl: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', { params: { search: search || undefined, role: role || undefined, status: status || undefined, page, limit: 10 } });
      setUsers(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setError('');
    } catch (cause: any) {
      setError(cause.response?.data?.message || 'Không tải được người dùng.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [search, role, status, page]);

  const updateStatus = async (user: User, nextStatus: UserStatus) => {
    try {
      await api.patch(`/users/${user.id}/status`, { status: nextStatus });
      toast.success('Đã cập nhật trạng thái.');
      await load();
    } catch (cause: any) {
      toast.error(cause.response?.data?.message || 'Không thể cập nhật trạng thái.');
    }
  };
  const showQr = async (user: User) => {
    try {
      const response = await api.get(`/users/${user.id}/qrcode`);
      setQr({ name: `${user.lastName} ${user.firstName}`, dataUrl: response.data.data.dataUrl });
    } catch (cause: any) {
      toast.error(cause.response?.data?.message || 'Không thể xem mã QR.');
    }
  };

  return <section className="page page-wide">
    <div className="page-intro"><div><span className="eyebrow">QUẢN TRỊ</span><h1>Người dùng</h1><p>Tìm kiếm, xem vai trò, trạng thái và mã QR.</p></div></div>
    <div className="admin-filters">
      <input aria-label="Tìm người dùng" placeholder="Tên hoặc email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      <select aria-label="Lọc vai trò" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="">Mọi vai trò</option><option value="READER">Độc giả</option><option value="LIBRARIAN">Thủ thư</option><option value="ADMIN">Quản trị viên</option></select>
      <select aria-label="Lọc trạng thái" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Mọi trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="SUSPENDED">Tạm khóa</option><option value="INACTIVE">Vô hiệu</option></select>
    </div>
    {error ? <ErrorState message={error} retry={load} /> : loading ? <LoadingState /> : users.length ? <div className="table-wrap"><table><thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.lastName} {user.firstName}</td><td>{user.email}</td><td>{user.role}</td><td>{user.status}</td><td><Button variant="secondary" onClick={() => showQr(user)}>Xem QR</Button>{user.status === 'ACTIVE' ? <Button variant="secondary" onClick={() => updateStatus(user, 'SUSPENDED')}>Tạm khóa</Button> : <Button variant="secondary" onClick={() => updateStatus(user, 'ACTIVE')}>Kích hoạt</Button>}</td></tr>)}</tbody></table></div> : <EmptyState title="Không có người dùng" body="Thử đổi điều kiện tìm kiếm." />}
    <div className="admin-pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page} / {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau</Button></div>
    {qr && <div className="admin-qr" role="dialog" aria-label="Mã QR người dùng"><h2>{qr.name}</h2><img src={qr.dataUrl} alt={`Mã QR của ${qr.name}`} /><Button onClick={() => setQr(null)}>Đóng</Button></div>}
  </section>;
}

export function SystemSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/system-settings');
      setSettings(response.data.data);
      setError('');
    } catch (cause: any) {
      setError(cause.response?.data?.message || 'Không tải được cài đặt.');
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const save = async (setting: Setting) => {
    try {
      await api.patch(`/system-settings/${setting.key}`, { value: setting.value });
      toast.success('Đã lưu cài đặt.');
      await load();
    } catch (cause: any) {
      toast.error(cause.response?.data?.message || 'Không thể lưu cài đặt.');
    }
  };
  return <section className="page page-wide"><div className="page-intro"><div><span className="eyebrow">QUẢN TRỊ</span><h1>Quy định thư viện</h1><p>Các hạn mức và mức phạt áp dụng cho nghiệp vụ mượn trả.</p></div></div>{error ? <ErrorState message={error} retry={load} /> : loading ? <LoadingState /> : <div className="table-wrap"><table><thead><tr><th>Quy định</th><th>Giá trị</th><th>Nguồn</th><th></th></tr></thead><tbody>{settings.map((setting) => <tr key={setting.key}><td><strong>{setting.key}</strong>{setting.description && <p>{setting.description}</p>}</td><td><input aria-label={`Giá trị ${setting.key}`} type="number" min="0" step="any" value={setting.value} onChange={(event) => setSettings((current) => current.map((item) => item.key === setting.key ? { ...item, value: Number(event.target.value) } : item))} /></td><td>{setting.isDefault ? 'Mặc định' : 'Đã lưu'}</td><td><Button onClick={() => save(setting)}>Lưu</Button></td></tr>)}</tbody></table></div>}</section>;
}
