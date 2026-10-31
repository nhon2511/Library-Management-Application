import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { Book, Category } from '../lib/types';
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  Status,
} from '../components/ui';
export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = params.get('search') || '';
  const categoryId = params.get('categoryId') || '';
  const available = params.get('available') === 'true';
  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/books', {
        params: {
          search,
          categoryId,
          available: available || undefined,
          page: params.get('page') || 1,
          limit: 12,
        },
      }),
      api.get('/categories', { params: { limit: 100 } }),
    ])
      .then(([b, c]) => {
        setBooks(b.data.data);
        setCategories(c.data.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Không tải được catalog.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [search, categoryId, available, params.get('page')]);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setParams({
      search: String(form.get('search') || ''),
      categoryId,
      available: available ? 'true' : '',
    });
  };
  return (
    <section className="page page-wide">
      <div className="page-intro">
        <div>
          <span className="eyebrow">MỤC LỤC MỞ</span>
          <h1>Tra cứu sách</h1>
          <p>
            Tìm theo tiêu đề, tác giả hoặc ISBN. Thông tin bản sao được cập nhật từ hệ thống thư
            viện.
          </p>
        </div>
        <div className="catalog-count">
          {loading ? '…' : books.length}
          <span>kết quả hiển thị</span>
        </div>
      </div>
      <form className="search-bar" onSubmit={submit}>
        <Input
          name="search"
          defaultValue={search}
          placeholder="Tìm tiêu đề, tác giả, ISBN…"
          aria-label="Tìm kiếm sách"
        />
        <Select
          value={categoryId}
          onChange={(e) => {
            setParams({ search, categoryId: e.target.value, available: available ? 'true' : '' });
          }}
          aria-label="Lọc theo danh mục"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <label className="check">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) =>
              setParams({ search, categoryId, available: e.target.checked ? 'true' : '' })
            }
          />{' '}
          Chỉ còn bản sao
        </label>
        <Button type="submit">Tìm kiếm</Button>
      </form>
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : loading ? (
        <LoadingState label="Đang tải danh mục sách" />
      ) : books.length === 0 ? (
        <EmptyState
          title={search || categoryId ? 'Không có sách phù hợp' : 'Catalog chưa có sách'}
          body={
            search || categoryId
              ? 'Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ catalog.'
              : 'Khi thư viện bổ sung đầu sách, chúng sẽ xuất hiện ở đây.'
          }
          action={
            (search || categoryId) && (
              <Button variant="secondary" onClick={() => setParams({})}>
                Xóa bộ lọc
              </Button>
            )
          }
        />
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}
function BookCard({ book }: { book: Book }) {
  return (
    <article className="book-card">
      <div className="book-cover">
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} alt={`Bìa ${book.title}`} />
        ) : (
          <span>
            {book.title
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()}
          </span>
        )}
      </div>
      <div className="book-info">
        <span className="book-category">{book.category?.name || 'Chưa phân loại'}</span>
        <h2>
          <Link to={`/books/${book.id}`}>{book.title}</Link>
        </h2>
        <p>{book.author}</p>
        <div className="book-meta">
          <span>
            {book.availableCopies}/{book.totalCopies} bản sao
          </span>
          <Status value={book.availableCopies ? 'AVAILABLE' : 'BORROWED'} />
        </div>
      </div>
    </article>
  );
}
export function BookDetailPage() {
  const id = location.pathname.split('/').pop();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get(`/books/${id}`)
      .then((r) => setBook(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Không tìm thấy sách.'));
  }, [id]);
  if (error)
    return (
      <section className="page">
        <ErrorState message={error} retry={() => location.reload()} />
      </section>
    );
  if (!book)
    return (
      <section className="page">
        <LoadingState />
      </section>
    );
  return (
    <section className="page detail-page">
      <Link to="/catalog" className="back-link">
        ← Về catalog
      </Link>
      <div className="detail-layout">
        <div className="detail-cover book-cover">{book.title.slice(0, 2).toUpperCase()}</div>
        <div>
          <span className="eyebrow">{book.category?.name || 'ĐẦU SÁCH'}</span>
          <h1>{book.title}</h1>
          <p className="detail-author">{book.author}</p>
          <p className="detail-description">{book.description || 'Đầu sách này chưa có mô tả.'}</p>
          <dl className="detail-facts">
            <div>
              <dt>ISBN</dt>
              <dd>{book.isbn}</dd>
            </div>
            <div>
              <dt>Nhà xuất bản</dt>
              <dd>{book.publisher || '—'}</dd>
            </div>
            <div>
              <dt>Năm xuất bản</dt>
              <dd>{book.publishedYear || '—'}</dd>
            </div>
            <div>
              <dt>Bản sao khả dụng</dt>
              <dd>
                {book.availableCopies}/{book.totalCopies}
              </dd>
            </div>
          </dl>
          <div className="copy-list">
            <h2>Vị trí kệ</h2>
            {book.copies?.length ? (
              <ul>
                {book.copies.map((c: any) => (
                  <li key={c.id}>
                    <span>{c.shelfLocation || 'Chưa gán kệ'}</span>
                    <Status value={c.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Chưa có thông tin bản sao.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
