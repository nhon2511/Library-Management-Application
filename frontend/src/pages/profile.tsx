import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import { Button, Field, Input, LoadingState, Notice, Status } from '../components/ui';
export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const { register, handleSubmit, reset } = useForm<{
    firstName: string;
    lastName: string;
    phone: string;
  }>();
  useEffect(() => {
    api
      .get('/users/me')
      .then((r) => reset(r.data.data))
      .finally(() => setLoading(false));
  }, [reset]);
  if (loading)
    return (
      <section className="page">
        <LoadingState />
      </section>
    );
  const submit = async (v: { firstName: string; lastName: string; phone: string }) => {
    try {
      const r = await api.patch('/users/me', v);
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
            <Input value={user?.email || ''} disabled />
          </Field>
          <Button type="submit">Lưu thay đổi</Button>
        </form>
        <aside className="reader-card">
          <span className="eyebrow">THẺ ĐỘC GIẢ</span>
          <div className="reader-avatar">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <h2>
            {user?.firstName} {user?.lastName}
          </h2>
          <p>{user?.email}</p>
          <div className="reader-qr">
            {user?.qrCode ? <span>{user.qrCode}</span> : <span>QR chưa được cấp</span>}
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
  const add = async () => {
    const quantity = Number(window.prompt('Số lượng bản sao', '1'));
    if (!quantity) return;
    const shelf = window.prompt('Vị trí kệ (tùy chọn)', '');
    try {
      await api.post(`/books/${id}/copies`, { quantity, shelfLocation: shelf || undefined });
      setNotice(`Đã thêm ${quantity} bản sao.`);
      setLoading(true);
      load();
    } catch (e: any) {
      setNotice(e.response?.data?.message || 'Không thể thêm bản sao.');
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
        <Button onClick={add}>Thêm bản sao</Button>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
