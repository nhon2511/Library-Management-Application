import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import type { User } from '../lib/types';
import { Button, Field, Input, LoadingState, Modal, Notice, Select, Status } from '../components/ui';
export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [qrImage, setQrImage] = useState('');
  const { register, handleSubmit, reset } = useForm<{
    firstName: string;
    lastName: string;
    phone: string;
  }>();
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const response = await api.get('/users/me');
        const data = response.data.data as User;
        if (!mounted) return;
        setProfile(data);
        updateUser(data);
        reset(data);
        const qrResponse = await api.get(`/users/${data.id}/qrcode`);
        if (mounted) setQrImage(qrResponse.data.data.dataUrl);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [reset, updateUser]);
  if (loading)
    return (
      <section className="page">
        <LoadingState />
      </section>
    );
  const submit = async (v: { firstName: string; lastName: string; phone: string }) => {
    try {
      const r = await api.patch('/users/me', v);
      setProfile(r.data.data);
      updateUser(r.data.data);
      setNotice('Hồ sơ đã được cập nhật.');
    } catch (e: any) {
      setNotice(e.response?.data?.message || 'Không thể cập nhật hồ sơ.');
    }
  };
  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">TÀI KHOẢN</span>
          <h1>Hồ sơ cá nhân</h1>
          <p>Thông tin hiển thị trên thẻ độc giả và tại quầy phục vụ.</p>
        </div>
      </div>
      {notice && <Notice tone="success">{notice}</Notice>}
      <div className="profile-layout">
        <form className="form-card stack" onSubmit={handleSubmit(submit)}>
          <h2>Thông tin cơ bản</h2>
          <div className="form-grid">
            <Field label="Họ">
              <Input {...register('firstName')} />
            </Field>
            <Field label="Tên">
              <Input {...register('lastName')} />
            </Field>
          </div>
          <Field label="Số điện thoại">
            <Input {...register('phone')} />
          </Field>
          <Field label="Email">
            <Input value={profile?.email || user?.email || ''} disabled />
          </Field>
          <Button type="submit">Lưu thay đổi</Button>
        </form>
        <aside className="reader-card">
          <span className="eyebrow">THẺ ĐỘC GIẢ</span>
          <div className="reader-avatar">
            {profile?.firstName?.[0]}
            {profile?.lastName?.[0]}
          </div>
          <h2>
            {profile?.firstName} {profile?.lastName}
          </h2>
          <p>{profile?.email}</p>
          <div className="reader-id">
            <span>ID độc giả</span>
            <code>{profile?.id || 'Chưa có'}</code>
          </div>
          <div className="reader-qr">
            {qrImage ? (
              <img src={qrImage} alt={`QR của ${profile?.email || 'độc giả'}`} />
            ) : profile?.qrCode ? (
              <span>{profile.qrCode}</span>
            ) : (
              <span>QR chưa được cấp</span>
            )}
          </div>
          <small>Mã định danh dùng tại quầy</small>
        </aside>
      </div>
    </section>
  );
}
export function CopiesPage() {
  const id = location.pathname.split('/')[3];
  const [copies, setCopies] = useState<any[]>([]);
  const [book, setBook] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingCopy, setEditingCopy] = useState<any | null>(null);
  const load = () =>
    Promise.all([api.get(`/books/${id}`), api.get(`/books/${id}/copies`)])
      .then(([b, c]) => {
        setBook(b.data.data);
        setCopies(c.data.data);
      })
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, [id]);
  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get('quantity'));
    const shelf = String(form.get('shelfLocation') || '').trim();
    if (!quantity || quantity < 1 || quantity > 100) {
      setNotice('Số lượng bản sao phải từ 1 đến 100.');
      return;
    }
    setAdding(true);
    try {
      await api.post(`/books/${id}/copies`, { quantity, shelfLocation: shelf || undefined });
      setNotice(`Đã thêm ${quantity} bản sao.`);
      setShowAddModal(false);
      setLoading(true);
      load();
    } catch (e: any) {
      setNotice(e.response?.data?.message || 'Không thể thêm bản sao.');
    } finally {
      setAdding(false);
    }
  };
  const saveCopy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCopy) return;
    const form = new FormData(event.currentTarget);
    const status = String(form.get('status'));
    const data: { shelfLocation?: string; condition?: string; status?: string } = {
      shelfLocation: String(form.get('shelfLocation') || ''),
      condition: String(form.get('condition') || ''),
    };
    if (['AVAILABLE', 'DAMAGED', 'LOST'].includes(status)) data.status = status;
    try {
      await api.patch(`/copies/${editingCopy.id}`, data);
      setNotice('Đã cập nhật bản sao.');
      setEditingCopy(null);
      setLoading(true);
      load();
    } catch (e: any) {
      setNotice(e.response?.data?.message || 'Không thể cập nhật bản sao.');
    }
  };
  return (
    <section className="page page-wide">
      <div className="page-intro">
        <div>
          <span className="eyebrow">KHO VẬT LÝ</span>
          <h1>{book?.title || 'Bản sao'}</h1>
          <p>Barcode và trạng thái của từng bản sao.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Thêm bản sao</Button>
      </div>
      {notice && <Notice tone="success">{notice}</Notice>}
      {loading ? (
        <LoadingState />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Kệ</th>
                <th>Trạng thái</th>
                <th>Điều kiện</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {copies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.barcode}</strong>
                  </td>
                  <td>{c.shelfLocation || '—'}</td>
                  <td>
                    <Status value={c.status} />
                  </td>
                  <td>{c.condition || '—'}</td>
                  <td>
                    <Button variant="ghost" onClick={() => setEditingCopy(c)}>
                      Sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editingCopy && (
        <Modal title="Chỉnh sửa bản sao" onClose={() => setEditingCopy(null)}>
          <form className="stack" onSubmit={saveCopy}>
            <Field label="Barcode">
              <Input value={editingCopy.barcode} disabled />
            </Field>
            <Field label="Vị trí kệ">
              <Input name="shelfLocation" defaultValue={editingCopy.shelfLocation || ''} />
            </Field>
            <Field label="Tình trạng">
              <Input name="condition" defaultValue={editingCopy.condition || ''} placeholder="Ví dụ: Tốt, bìa xước nhẹ" />
            </Field>
            <Field label="Trạng thái">
              <Select
                name="status"
                defaultValue={editingCopy.status}
                disabled={['BORROWED', 'RESERVED'].includes(editingCopy.status)}
              >
                <option value="AVAILABLE">Có sẵn</option>
                <option value="DAMAGED">Hỏng</option>
                <option value="LOST">Mất</option>
                {editingCopy.status === 'BORROWED' && <option value="BORROWED">Đang mượn</option>}
                {editingCopy.status === 'RESERVED' && <option value="RESERVED">Đã giữ</option>}
              </Select>
              {['BORROWED', 'RESERVED'].includes(editingCopy.status) && (
                <small>Không thể đổi trạng thái khi bản sao đang được mượn hoặc đặt giữ.</small>
              )}
            </Field>
            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={() => setEditingCopy(null)}>
                Hủy
              </Button>
              <Button type="submit">Lưu thay đổi</Button>
            </div>
          </form>
        </Modal>
      )}
      {showAddModal && (
        <Modal title="Thêm bản sao vật lý" onClose={() => setShowAddModal(false)}>
          <form className="stack" onSubmit={add}>
            <Notice tone="info">
              Hệ thống sẽ tự sinh barcode riêng cho từng bản sao mới.
            </Notice>
            <Field label="Số lượng bản sao">
              <Input name="quantity" type="number" min="1" max="100" defaultValue="1" required />
              <small>Tối đa 100 bản sao mỗi lần thêm.</small>
            </Field>
            <Field label="Vị trí kệ">
              <Input name="shelfLocation" placeholder="Ví dụ: IT-A1-01" maxLength={100} />
              <small>Các bản sao sẽ dùng cùng vị trí kệ này.</small>
            </Field>
            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? 'Đang thêm…' : 'Thêm bản sao'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
