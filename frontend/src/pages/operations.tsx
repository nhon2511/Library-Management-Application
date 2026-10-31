import { Link } from 'react-router-dom';
import { useEffect as reactUseEffect, useState } from 'react';
import api from '../lib/api';
import type { Book, Category, User, Borrow } from '../lib/types';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  Notice,
  Select,
  Status,
} from '../components/ui';
const useEffect = (fn: () => unknown, deps: unknown[]) =>
  reactUseEffect(() => {
    void fn();
  }, deps);
const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const date = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');
export function OperationsDashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const load = () =>
    api
      .get('/reports/overview')
      .then((r) => setData(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Không tải được báo cáo vận hành.'));
  useEffect(load, []);
  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">BẢNG ĐIỀU PHỐI</span>
          <h1>Vận hành hôm nay</h1>
          <p>Những con số giúp bạn quyết định việc cần xử lý trước.</p>
        </div>
        <Link to="/desk/checkout" className="btn btn-primary">
          Mở quầy mượn
        </Link>
      </div>
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <>
          <div className="metric-strip">
            {[
              ['Đầu sách', data.totalBooks],
              ['Bản sao khả dụng', `${data.availableCopies}/${data.totalCopies}`],
              ['Đang mượn', data.activeBorrows],
              ['Đang quá hạn', data.overdueBorrows],
              ['Phạt chưa thu', money(data.unpaidFinesTotal)],
            ].map(([label, value]) => (
              <div key={label as string} className="metric">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="ops-grid">
            <div className="action-panel">
              <span className="eyebrow">CÔNG VIỆC TIẾP THEO</span>
              <h2>Nhịp làm việc tại quầy</h2>
              <Link to="/desk/checkout" className="action-link">
                <strong>01</strong>
                <span>
                  Checkout bản sao<small>Quét mã độc giả và barcode</small>
                </span>
                →
              </Link>
              <Link to="/desk/return" className="action-link">
                <strong>02</strong>
                <span>
                  Tiếp nhận trả sách<small>Đánh giá tình trạng, tạo phạt</small>
                </span>
                →
              </Link>
              <Link to="/manage/books" className="action-link">
                <strong>03</strong>
                <span>
                  Cập nhật kho sách<small>Đầu sách và bản sao vật lý</small>
                </span>
                →
              </Link>
            </div>
            <div className="ops-note">
              <span className="eyebrow">GÓC NHÌN</span>
              <h2>Quyết định dựa trên dữ liệu thật</h2>
              <p>
                Dashboard chỉ hiển thị chỉ số được trả về từ API báo cáo. Khi hệ thống chưa có dữ
                liệu, các khu vực sẽ để trống thay vì dựng số liệu mẫu.
              </p>
              <Link to="/reports">Mở báo cáo đầy đủ →</Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
export function ManageBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/books', { params: { limit: 50 } }),
      api.get('/categories', { params: { limit: 100 } }),
    ])
      .then(([b, c]) => {
        setBooks(b.data.data);
        setCats(c.data.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Không tải được kho sách.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  return (
    <section className="page page-wide">
      <div className="page-intro">
        <div>
          <span className="eyebrow">DANH MỤC VÀ KHO</span>
          <h1>Đầu sách</h1>
          <p>Quản lý metadata đầu sách và số lượng bản sao vật lý.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          Thêm đầu sách
        </Button>
      </div>
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : loading ? (
        <LoadingState />
      ) : books.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Đầu sách</th>
                <th>ISBN</th>
                <th>Danh mục</th>
                <th>Kho</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.title}</strong>
                    <small>{b.author}</small>
                  </td>
                  <td>{b.isbn}</td>
                  <td>{b.category?.name || '—'}</td>
                  <td>
                    {b.availableCopies}/{b.totalCopies} bản sao
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link className="btn btn-ghost" to={`/manage/books/${b.id}/copies`}>
                        Bản sao
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditing(b);
                          setModal(true);
                        }}
                      >
                        Sửa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Kho sách trống"
          body="Thêm đầu sách đầu tiên để bắt đầu quản lý catalog."
          action={<Button onClick={() => setModal(true)}>Thêm đầu sách</Button>}
        />
      )}{' '}
      {modal && (
        <BookModal
          book={editing}
          categories={cats}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            load();
          }}
        />
      )}
    </section>
  );
}
function BookModal({
  book,
  categories,
  onClose,
  onSaved,
}: {
  book: Book | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const data = {
      isbn: String(f.get('isbn')),
      title: String(f.get('title')),
      author: String(f.get('author')),
      publisher: String(f.get('publisher') || ''),
      publishedYear: f.get('publishedYear') ? Number(f.get('publishedYear')) : undefined,
      price: Number(f.get('price') || 0),
      categoryId: String(f.get('categoryId')),
      description: String(f.get('description') || ''),
    };
    try {
      if (book) await api.patch(`/books/${book.id}`, data);
      else await api.post('/books', data);
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không lưu được đầu sách.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={book ? 'Sửa đầu sách' : 'Thêm đầu sách'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Tiêu đề">
          <Input name="title" defaultValue={book?.title} required />
        </Field>
        <div className="form-grid">
          <Field label="Tác giả">
            <Input name="author" defaultValue={book?.author} required />
          </Field>
          <Field label="ISBN">
            <Input name="isbn" defaultValue={book?.isbn} required />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Danh mục">
            <Select name="categoryId" defaultValue={book?.categoryId} required>
              <option value="">Chọn danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Giá bìa">
            <Input name="price" type="number" min="0" defaultValue={book?.price || 0} required />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Nhà xuất bản">
            <Input name="publisher" defaultValue={book?.publisher} />
          </Field>
          <Field label="Năm xuất bản">
            <Input name="publishedYear" type="number" defaultValue={book?.publishedYear} />
          </Field>
        </div>
        <Field label="Mô tả">
          <textarea
            className="input textarea"
            name="description"
            defaultValue={book?.description}
          />
        </Field>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={busy} type="submit">
            {busy ? 'Đang lưu…' : 'Lưu đầu sách'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function ManageCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const load = () =>
    api
      .get('/categories', { params: { limit: 100 } })
      .then((r) => setItems(r.data.data))
      .finally(() => setLoading(false));
  useEffect(load, []);
  return (
    <section className="page page-wide">
      <div className="page-intro">
        <div>
          <span className="eyebrow">TAXONOMY</span>
          <h1>Danh mục</h1>
          <p>Giữ cấu trúc phân loại rõ ràng cho catalog học thuật.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          Thêm danh mục
        </Button>
      </div>
      {loading ? (
        <LoadingState />
      ) : items.length ? (
        <div className="category-grid">
          {items.map((c) => (
            <article className="category-card" key={c.id}>
              <span className="eyebrow">{c.slug}</span>
              <h2>{c.name}</h2>
              <p>{c.description || 'Chưa có mô tả.'}</p>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(c);
                  setModal(true);
                }}
              >
                Sửa danh mục
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có danh mục" body="Tạo danh mục để catalog dễ tìm kiếm hơn." />
      )}
      {modal && (
        <CategoryModal
          item={editing}
          close={() => setModal(false)}
          saved={() => {
            setModal(false);
            setLoading(true);
            load();
          }}
        />
      )}
    </section>
  );
}
function CategoryModal({
  item,
  close,
  saved,
}: {
  item: Category | null;
  close: () => void;
  saved: () => void;
}) {
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = { name: String(f.get('name')), description: String(f.get('description') || '') };
    if (item) await api.patch(`/categories/${item.id}`, data);
    else await api.post('/categories', data);
    saved();
  };
  return (
    <Modal title={item ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={close}>
      <form className="stack" onSubmit={submit}>
        <Field label="Tên danh mục">
          <Input name="name" defaultValue={item?.name} required />
        </Field>
        <Field label="Mô tả">
          <textarea
            className="input textarea"
            name="description"
            defaultValue={item?.description}
          />
        </Field>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={close}>
            Hủy
          </Button>
          <Button type="submit">Lưu danh mục</Button>
        </div>
      </form>
    </Modal>
  );
}
export function CheckoutPage() {
  const [userId, setUserId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const add = () => {
    const v = barcode.trim();
    if (!v) return;
    if (barcodes.includes(v)) {
      setNotice('Barcode này đã có trong phiên.');
      return;
    }
    if (barcodes.length >= 5) {
      setNotice('Mỗi lần checkout tối đa 5 bản sao.');
      return;
    }
    setBarcodes([...barcodes, v]);
    setBarcode('');
  };
  const submit = async () => {
    setBusy(true);
    try {
      await api.post('/borrows/checkout', { userId, copyBarcodes: barcodes });
      setNotice('Checkout thành công.');
      setUserId('');
      setBarcodes([]);
    } catch (e: any) {
      setNotice(e.response?.data?.message || 'Checkout thất bại.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">QUẦY PHỤC VỤ</span>
          <h1>Checkout</h1>
          <p>
            Nhập mã độc giả và barcode bản sao. Camera chưa được bật vì backend chưa cung cấp
            scanner session.
          </p>
        </div>
      </div>
      <div className="desk-panel">
        <Field label="Mã độc giả / ID">
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Dán mã QR hoặc nhập user ID"
          />
        </Field>
        <div className="scan-row">
          <Field label="Barcode bản sao">
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
              placeholder="LIB-…"
            />
          </Field>
          <Button variant="secondary" onClick={add}>
            Thêm mã
          </Button>
        </div>
        {notice && (
          <Notice tone={notice.includes('thành công') ? 'success' : 'error'}>{notice}</Notice>
        )}
        <div className="scan-list">
          {barcodes.length ? (
            barcodes.map((b, i) => (
              <div className="scan-item" key={b}>
                <span>0{i + 1}</span>
                <strong>{b}</strong>
                <button
                  onClick={() => setBarcodes(barcodes.filter((x) => x !== b))}
                  aria-label={`Xóa ${b}`}
                >
                  Xóa
                </button>
              </div>
            ))
          ) : (
            <EmptyState title="Chưa có bản sao" body="Thêm barcode để tạo một phiên checkout." />
          )}
        </div>
        <Button disabled={busy || !userId || !barcodes.length} onClick={submit}>
          {busy ? 'Đang xử lý…' : 'Xác nhận giao sách'}
        </Button>
      </div>
    </section>
  );
}
export function ReturnPage() {
  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">QUẦY PHỤC VỤ</span>
          <h1>Return desk</h1>
          <p>
            Endpoint hiện tại yêu cầu `borrowRecordId` và `bookCopyId`; nhập mã phiếu để tra cứu cần
            được backend bổ sung.
          </p>
        </div>
      </div>
      <Notice tone="info">
        Luồng trả sách sẵn sàng ở tầng API (`POST /borrows/:id/return`). UI tra cứu phiếu theo
        barcode chưa thể hoàn thiện vì backend chưa có endpoint tìm phiếu đang mượn.
      </Notice>
      <div className="desk-panel">
        <Field label="Mã phiếu mượn">
          <Input disabled placeholder="Chờ endpoint GET /borrows/:id hoặc lookup theo barcode" />
        </Field>
        <Field label="Tình trạng từng bản sao">
          <Select disabled>
            <option>Chưa có dữ liệu để chọn</option>
          </Select>
        </Field>
        <Button disabled>Ghi nhận trả sách</Button>
      </div>
    </section>
  );
}
export function ReportsPage() {
  const [data, setData] = useState<any>();
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/reports/overview')
      .then((r) => setData(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Không tải được báo cáo.'));
  }, []);
  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">BÁO CÁO</span>
          <h1>Góc nhìn vận hành</h1>
          <p>Chỉ số tổng quan phản ánh trực tiếp dữ liệu hiện có trong API.</p>
        </div>
      </div>
      {error ? (
        <ErrorState message={error} retry={() => location.reload()} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <div className="report-summary">
          <h2>Hiện trạng kho và giao dịch</h2>
          <div className="report-bars">
            {[
              ['Đầu sách', data.totalBooks],
              ['Bản sao khả dụng', data.availableCopies],
              ['Đang mượn', data.activeBorrows],
              ['Quá hạn', data.overdueBorrows],
              ['Độc giả', data.totalUsers],
            ].map(([label, value]) => (
              <div className="report-bar" key={label as string}>
                <span>{label}</span>
                <strong>{value}</strong>
                <div>
                  <i style={{ width: `${Math.min(100, Number(value) || 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Notice tone="info">
            Các biểu đồ top sách, quá hạn theo danh mục và doanh thu phạt chưa hiển thị vì
            `/reports/overview` hiện chỉ trả về số tổng quan.
          </Notice>
        </div>
      )}
    </section>
  );
}
export function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/audit-logs')
      .then((r) => setLogs(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Bạn không có quyền xem audit logs.'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="page page-wide">
      <div className="page-intro">
        <div>
          <span className="eyebrow">ADMIN ONLY</span>
          <h1>Audit logs</h1>
          <p>Dấu vết của các thao tác nhạy cảm trong hệ thống.</p>
        </div>
      </div>
      {error ? (
        <ErrorState message={error} retry={() => location.reload()} />
      ) : loading ? (
        <LoadingState />
      ) : logs.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Actor</th>
                <th>Hành động</th>
                <th>Entity</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.createdAt).toLocaleString('vi-VN')}</td>
                  <td>{l.actor?.email || '—'}</td>
                  <td>
                    <strong>{l.action}</strong>
                  </td>
                  <td>{l.entity}</td>
                  <td>
                    <code>{JSON.stringify(l.details || {})}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Chưa có audit log"
          body="Các thao tác nhạy cảm sẽ xuất hiện khi có dữ liệu."
        />
      )}
    </section>
  );
}
