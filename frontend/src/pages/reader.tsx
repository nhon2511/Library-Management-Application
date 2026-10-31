import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Borrow, Fine } from '../lib/types';
import { Button, EmptyState, ErrorState, LoadingState, Notice, Status } from '../components/ui';
const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const date = (v?: string) =>
  v
    ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
export function ReaderDashboard() {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      api.get('/borrows/my', { params: { limit: 5 } }),
      api.get('/fines', { params: { limit: 5, status: 'UNPAID' } }),
    ])
      .then(([b, f]) => {
        setBorrows(b.data.data);
        setFines(f.data.data);
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">KHÔNG GIAN CỦA BẠN</span>
          <h1>Chào {user?.firstName},</h1>
          <p>Đây là nơi bạn theo dõi những cuốn sách đang đồng hành cùng mình.</p>
        </div>
        <Link to="/catalog" className="btn btn-primary">
          Tìm sách mới
        </Link>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="decision-grid">
            <div className="decision-card">
              <span className="eyebrow">ĐANG MƯỢN</span>
              <strong>
                {borrows.filter((b) => ['BORROWED', 'OVERDUE'].includes(b.status)).length}
              </strong>
              <p>phiếu đang mở</p>
              <Link to="/reader/my-borrows">Xem các phiếu mượn →</Link>
            </div>
            <div className="decision-card accent">
              <span className="eyebrow">CẦN LƯU Ý</span>
              <strong>
                {fines.length ? money(fines.reduce((s, f) => s + f.amount, 0)) : 'Không có'}
              </strong>
              <p>{fines.length ? 'tiền phạt chưa thu' : 'Tài khoản đang ổn định'}</p>
              <Link to="/reader/fines">Xem tiền phạt →</Link>
            </div>
            <div className="decision-card quiet">
              <span className="eyebrow">THẺ ĐỘC GIẢ</span>
              <strong className="reader-code">{user?.qrCode ? 'Đã cấp' : 'Chưa cấp'}</strong>
              <p>QR định danh tại quầy</p>
              <Link to="/profile">Mở hồ sơ →</Link>
            </div>
          </div>
          <div className="section-heading">
            <div>
              <span className="eyebrow">LỊCH SỬ GẦN ĐÂY</span>
              <h2>Những phiếu mượn mới nhất</h2>
            </div>
            <Link to="/reader/my-borrows">Xem tất cả</Link>
          </div>
          {borrows.length ? (
            <div className="record-list">
              {borrows.slice(0, 3).map((b) => (
                <BorrowRow key={b.id} borrow={b} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có phiếu mượn"
              body="Khi bạn đặt mượn một đầu sách, lịch sử sẽ xuất hiện ở đây."
              action={
                <Link to="/catalog" className="btn btn-secondary">
                  Mở catalog
                </Link>
              }
            />
          )}
        </>
      )}
    </section>
  );
}
function BorrowRow({ borrow, onRenew }: { borrow: Borrow; onRenew?: () => void }) {
  return (
    <article className="record-row">
      <div>
        <strong>{borrow.items?.[0]?.bookCopy?.book?.title || 'Phiếu mượn'}</strong>
        <span>
          {borrow.items?.length || 0} bản sao · Hạn trả {date(borrow.dueDate)}
        </span>
      </div>
      <Status value={borrow.status} />
      {onRenew && (
        <Button variant="secondary" onClick={onRenew}>
          Gia hạn
        </Button>
      )}
    </article>
  );
}
export function MyBorrowsPage() {
  const [items, setItems] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = () => {
    setLoading(true);
    api
      .get('/borrows/my')
      .then((r) => setItems(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Không tải được lịch sử.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const renew = async (id: string) => {
    try {
      await api.post(`/borrows/${id}/renew`);
      setNotice('Đã gia hạn phiếu mượn.');
      load();
    } catch (e: any) {
      setNotice(e.response?.data?.message || 'Không thể gia hạn phiếu mượn.');
    }
  };
  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">ĐỘC GIẢ</span>
          <h1>Mượn của tôi</h1>
          <p>Theo dõi hạn trả, trạng thái và quyền gia hạn của từng phiếu.</p>
        </div>
      </div>
      {notice && <Notice tone="info">{notice}</Notice>}
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : loading ? (
        <LoadingState />
      ) : items.length ? (
        <div className="record-list">
          {items.map((b) => (
            <BorrowRow
              key={b.id}
              borrow={b}
              onRenew={b.status === 'BORROWED' && b.renewCount < 2 ? () => renew(b.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có lịch sử mượn"
          body="Bạn chưa có phiếu mượn nào trong hệ thống."
          action={
            <Link to="/catalog" className="btn btn-primary">
              Tra cứu sách
            </Link>
          }
        />
      )}
    </section>
  );
}
export function ReaderFinesPage() {
  return <FinesPage reader />;
}
export function FinesPage({ reader = false }: { reader?: boolean }) {
  const [items, setItems] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = () => {
    setLoading(true);
    api
      .get('/fines', { params: { limit: 50 } })
      .then((r) => setItems(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Không tải được danh sách tiền phạt.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const settle = async (id: string) => {
    try {
      await api.patch(`/fines/${id}/settle`, { paymentMethod: 'CASH' });
      setNotice('Đã ghi nhận thu tiền.');
      load();
    } catch (e: any) {
      setNotice(e.response?.data?.message || 'Không thể cập nhật khoản phạt.');
    }
  };
  const waive = async (id: string) => {
    const reason = window.prompt('Nhập lý do miễn giảm');
    if (!reason) return;
    try {
      await api.patch(`/fines/${id}/waive`, { reason });
      setNotice('Đã miễn giảm khoản phạt.');
      load();
    } catch (e: any) {
      setNotice(e.response?.data?.message || 'Không thể miễn giảm khoản phạt.');
    }
  };
  return (
    <section className="page page-wide">
      <div className="page-intro">
        <div>
          <span className="eyebrow">{reader ? 'TÀI KHOẢN ĐỘC GIẢ' : 'VẬN HÀNH'}</span>
          <h1>Tiền phạt</h1>
          <p>
            {reader
              ? 'Các khoản phát sinh từ việc trả sách, hỏng hoặc mất bản sao.'
              : 'Theo dõi và xử lý các khoản phạt trong toàn hệ thống.'}
          </p>
        </div>
      </div>
      {notice && <Notice tone="info">{notice}</Notice>}
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : loading ? (
        <LoadingState />
      ) : items.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Đối tượng</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id}>
                  <td>
                    {reader
                      ? 'Khoản phạt của bạn'
                      : `${f.user?.firstName || ''} ${f.user?.lastName || ''}`}
                    <small>{f.reason || '—'}</small>
                  </td>
                  <td>{f.type}</td>
                  <td>
                    <strong>{money(f.amount)}</strong>
                  </td>
                  <td>
                    <Status value={f.status} />
                  </td>
                  <td>{date(f.createdAt)}</td>
                  <td>
                    {f.status === 'UNPAID' && (
                      <div className="row-actions">
                        <Button variant="secondary" onClick={() => settle(f.id)}>
                          Thu tiền
                        </Button>
                        {!reader && (
                          <Button variant="ghost" onClick={() => waive(f.id)}>
                            Miễn
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Không có khoản phạt"
          body="Tài khoản hiện không có khoản phạt nào cần xử lý."
        />
      )}
    </section>
  );
}
