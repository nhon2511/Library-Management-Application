import { Link } from 'react-router-dom';
import { useEffect as reactUseEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import { Camera, Download, Plus, ScanLine, Trash2 } from 'lucide-react';
import api from '../lib/api';
import type { Book, Category, User, Borrow } from '../lib/types';
import { Scanner } from '../components/scanner';
import { Html5QrcodeSupportedFormats } from 'html5-qrcode';
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
type ReaderLookup = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'status'>;
type ReturnLookup = {
  borrowRecordId: string;
  bookCopyId: string;
  barcode: string;
  bookTitle: string;
  bookPrice?: number;
  reader: { id: string; fullName: string; email: string };
  dueDate?: string;
  overdue: boolean;
  overdueDays: number;
};

export function CheckoutPage() {
  const [userId, setUserId] = useState('');
  const [reader, setReader] = useState<ReaderLookup | null>(null);
  const [barcode, setBarcode] = useState('');
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const lookupReader = async (qrCode: string) => {
    try {
      const { data } = await api.get('/users/lookup', { params: { qrCode } });
      setReader(data.data);
      setUserId(data.data.id);
      toast.success(`Đã nhận diện ${data.data.lastName} ${data.data.firstName}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không tìm thấy độc giả.');
    }
  };
  const add = (value = barcode) => {
    const next = value.trim();
    if (!next) return;
    if (barcodes.includes(next)) {
      toast.error('Barcode này đã có trong phiên.');
      return;
    }
    if (barcodes.length >= 5) {
      toast.error('Mỗi lần checkout tối đa 5 bản sao.');
      return;
    }
    setBarcodes((current) => [...current, next]);
    setBarcode('');
    toast.success(`Đã thêm ${next}`);
  };
  const submit = async () => {
    setBusy(true);
    try {
      await api.post('/borrows/checkout', { userId, copyBarcodes: barcodes });
      toast.success('Checkout thành công.');
      setUserId('');
      setReader(null);
      setBarcodes([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Checkout thất bại.');
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
          <p>Quét QR thẻ độc giả và barcode từng bản sao để giao sách nhanh hơn.</p>
        </div>
        <ScanLine size={34} strokeWidth={1.5} />
      </div>
      <div className="desk-panel checkout-panel">
        <div className="scanner-field">
          <Field label="Mã độc giả / QR thẻ">
            <Input
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setReader(null);
              }}
              placeholder="Quét QR hoặc nhập user ID"
            />
          </Field>
          <Scanner
            label="Quét thẻ độc giả"
            onScan={lookupReader}
            formats={[Html5QrcodeSupportedFormats.QR_CODE]}
          />
        </div>
        {reader && (
          <div className="lookup-card">
            <strong>{reader.lastName} {reader.firstName}</strong>
            <span>{reader.email}</span>
            <span className="status status-active">Tài khoản hoạt động</span>
          </div>
        )}
        <div className="scan-row">
          <Field label="Barcode bản sao">
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
              placeholder="LIB-…"
            />
          </Field>
          <Button variant="secondary" onClick={() => add()}><Plus size={16} /> Thêm mã</Button>
        </div>
        <Scanner label="Quét barcode sách" onScan={add} />
        <div className="scan-list">
          {barcodes.length ? barcodes.map((value, index) => (
            <div className="scan-item" key={value}>
              <span>0{index + 1}</span>
              <strong>{value}</strong>
              <button onClick={() => setBarcodes((current) => current.filter((item) => item !== value))} aria-label={`Xóa ${value}`}>
                <Trash2 size={15} />
              </button>
            </div>
          )) : <EmptyState title="Chưa có bản sao" body="Thêm barcode để tạo một phiên checkout." />}
        </div>
        <Button disabled={busy || !userId || !barcodes.length} onClick={submit}>
          {busy ? 'Đang xử lý…' : 'Xác nhận giao sách'}
        </Button>
      </div>
    </section>
  );
}

export function ReturnPage() {
  const [barcode, setBarcode] = useState('');
  const [lookup, setLookup] = useState<ReturnLookup | null>(null);
  const [condition, setCondition] = useState('GOOD');
  const [busy, setBusy] = useState(false);

  const findBorrow = async (value = barcode) => {
    if (!value.trim()) return;
    try {
      const { data } = await api.get('/borrows/lookup', { params: { barcode: value.trim() } });
      setLookup(data.data);
      setCondition('GOOD');
      toast.success('Đã tìm thấy phiếu mượn.');
    } catch (error: any) {
      setLookup(null);
      toast.error(error.response?.data?.message || 'Không tìm thấy phiếu mượn đang hoạt động.');
    }
  };
  const price = lookup?.bookPrice || 0;
  const fine = condition === 'LIGHT_DAMAGE' ? price * 0.2
    : condition === 'HEAVY_DAMAGE' ? price * 0.5
      : condition === 'LOST' ? price + 20000
        : Math.max(0, (lookup?.overdueDays || 0) - 1) * 5000;
  const submit = async () => {
    if (!lookup) return;
    setBusy(true);
    try {
      await api.post(`/borrows/${lookup.borrowRecordId}/return`, {
        items: [{ bookCopyId: lookup.bookCopyId, condition }],
      });
      toast.success('Đã ghi nhận trả sách.');
      setLookup(null);
      setBarcode('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể ghi nhận trả sách.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">QUẦY PHỤC VỤ</span>
          <h1>Return desk</h1>
          <p>Quét barcode sách mang trả để tính trễ hạn và phí hỏng ngay tại quầy.</p>
        </div>
      </div>
      <div className="desk-panel return-panel">
        <div className="scan-row">
          <Field label="Barcode sách">
            <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), findBorrow())} placeholder="LIB-…" />
          </Field>
          <Button variant="secondary" onClick={() => findBorrow()}><ScanLine size={16} /> Tra cứu</Button>
        </div>
        <Scanner label="Quét barcode trả sách" onScan={findBorrow} />
        {lookup ? (
          <div className="return-result">
            <div className="lookup-card">
              <strong>{lookup.bookTitle}</strong>
              <span>{lookup.reader.fullName} · {lookup.reader.email}</span>
              <span>Hạn trả: {date(lookup.dueDate)} · Trễ: {lookup.overdueDays} ngày</span>
              {lookup.overdue && <Status value="OVERDUE" />}
            </div>
            <Field label="Tình trạng sách">
              <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="GOOD">Tốt</option>
                <option value="LIGHT_DAMAGE">Hỏng nhẹ</option>
                <option value="HEAVY_DAMAGE">Hỏng nặng</option>
                <option value="LOST">Mất sách</option>
              </Select>
            </Field>
            <div className="fine-preview">
              <span>Phạt tạm tính</span>
              <strong>{money(fine)}</strong>
              <small>{condition === 'GOOD' ? '5.000đ/ngày sau ân hạn 1 ngày' : 'Tính theo phần trăm giá bìa'}</small>
            </div>
            <Button disabled={busy} onClick={submit}>{busy ? 'Đang xử lý…' : 'Ghi nhận trả sách'}</Button>
          </div>
        ) : <EmptyState title="Chưa có phiếu mượn" body="Quét barcode để hiển thị độc giả và tình trạng khoản mượn." />}
      </div>
    </section>
  );
}

const chartColors = ['#28584d', '#b96f52', '#6d8b74', '#d29a7e', '#829b8b', '#a85f48'];

export function ReportsPage() {
  const [overview, setOverview] = useState<any>();
  const [topBooks, setTopBooks] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState('');
  const load = () => Promise.all([
    api.get('/reports/overview'),
    api.get('/reports/top-books'),
    api.get('/reports/monthly-trends'),
    api.get('/reports/categories-ratio'),
  ]).then(([summary, books, trends, ratio]) => {
    setOverview(summary.data.data);
    setTopBooks(books.data.data);
    setMonthly(trends.data.data);
    setCategories(ratio.data.data);
  }).catch((e) => setError(e.response?.data?.message || 'Không tải được báo cáo.'));
  useEffect(load, []);
  const exportExcel = async () => {
    try {
      const response = await api.get('/reports/export/excel', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'borrows-report.xlsx';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải báo cáo Excel.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể xuất báo cáo Excel.');
    }
  };
  return (
    <section className="page page-wide">
      <div className="page-intro">
        <div><span className="eyebrow">BÁO CÁO</span><h1>Góc nhìn vận hành</h1><p>Dữ liệu mượn trả được trình bày để ra quyết định nhanh tại quầy.</p></div>
        <Button variant="secondary" onClick={exportExcel}><Download size={16} /> Xuất Excel</Button>
      </div>
      {error ? <ErrorState message={error} retry={load} /> : !overview ? <LoadingState /> : (
        <div className="report-layout">
          <div className="metric-strip">
            {[['Đầu sách', overview.totalBooks], ['Bản sao khả dụng', overview.availableCopies], ['Đang mượn', overview.activeBorrows], ['Quá hạn', overview.overdueBorrows], ['Độc giả', overview.totalUsers]].map(([label, value]) => <div className="metric" key={label as string}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
          <div className="chart-grid">
            <article className="chart-card chart-wide"><div className="section-heading"><div><span className="eyebrow">TOP 10</span><h2>Sách được mượn nhiều nhất</h2></div></div><ResponsiveContainer width="100%" height={310}><BarChart data={topBooks} layout="vertical" margin={{ left: 20, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#d8d2c7" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="borrowCount" name="Lượt mượn" fill="#28584d" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></article>
            <article className="chart-card"><span className="eyebrow">6 THÁNG</span><h2>Xu hướng mượn / trả</h2><ResponsiveContainer width="100%" height={310}><AreaChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke="#d8d2c7" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="checkouts" name="Mượn" stroke="#28584d" fill="#28584d" fillOpacity={0.18} /><Area type="monotone" dataKey="returns" name="Trả" stroke="#b96f52" fill="#b96f52" fillOpacity={0.14} /></AreaChart></ResponsiveContainer></article>
            <article className="chart-card"><span className="eyebrow">PHÂN BỔ</span><h2>Sách theo thể loại</h2><ResponsiveContainer width="100%" height={310}><PieChart><Pie data={categories} dataKey="bookCount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={105} label>{categories.map((entry, index) => <Cell key={entry.categoryId} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></article>
          </div>
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
