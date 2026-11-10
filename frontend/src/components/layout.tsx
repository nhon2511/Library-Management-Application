import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, roleLabel } from '../lib/auth';
import { Button } from './ui';

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const reader = user?.role === 'READER';
  const admin = user?.role === 'ADMIN';
  const links = reader
    ? [
        ['/reader/dashboard', 'Tổng quan'],
        ['/catalog', 'Tra cứu sách'],
        ['/reader/my-borrows', 'Mượn của tôi'],
        ['/reader/fines', 'Tiền phạt'],
        ['/profile', 'Hồ sơ'],
      ]
    : [
        ['/operations', 'Tổng quan'],
        ['/catalog', 'Tra cứu sách'],
        ['/manage/books', 'Đầu sách'],
        ['/manage/categories', 'Danh mục'],
        ['/desk/checkout', 'Mượn tại quầy'],
        ['/desk/return', 'Trả sách'],
        ['/manage/fines', 'Tiền phạt'],
        ['/reports', 'Báo cáo'],
        ...(admin ? [['/audit-logs', 'Audit logs']] : []),
        ['/profile', 'Hồ sơ'],
      ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to={reader ? '/reader/dashboard' : '/operations'} className="brand">
          <span className="brand-mark">TL</span>
          <span>
            Thư viện
            <br />
            <em>học thuật</em>
          </span>
        </Link>
        <div className="sidebar-rule" />
        <nav aria-label="Điều hướng chính">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="user-summary">
            <strong>
              {user?.firstName} {user?.lastName}
            </strong>
            <span>{user && roleLabel(user.role)}</span>
          </div>
          <button
            aria-label="Đăng xuất"
            className="logout"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            Thoát
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <span className="mobile-brand">Thư viện học thuật</span>
          <span className="topbar-date">Không gian đọc và vận hành</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
export function PublicShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const homePath = user?.role === 'READER' ? '/reader/dashboard' : '/operations';

  const handleSignOut = async () => {
    await signOut();
    navigate('/catalog');
  };

  return (
    <div className="public-shell">
      <header className="public-nav">
        <Link to="/catalog" className="brand">
          <span className="brand-mark">TL</span>
          <span>
            Thư viện
            <br />
            <em>học thuật</em>
          </span>
        </Link>
        <nav>
          <Link to="/catalog">Tra cứu sách</Link>
          {user ? (
            <>
              <Link to={homePath}>Không gian của tôi</Link>
              <Link to="/profile">Hồ sơ</Link>
              <button type="button" className="public-logout" onClick={handleSignOut}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register" className="public-cta">
                Tạo tài khoản
              </Link>
            </>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
