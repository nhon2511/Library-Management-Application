import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button, Field, Input, Notice } from '../components/ui';
import api from '../lib/api';
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Nhập mật khẩu'),
});
const registerSchema = z.object({
  firstName: z.string().min(1, 'Nhập họ'),
  lastName: z.string().min(1, 'Nhập tên'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});
export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });
  const submit = async (v: z.infer<typeof loginSchema>) => {
    try {
      await signIn(v.email, v.password);
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Email hoặc mật khẩu không đúng.');
    }
  };
  return (
    <AuthFrame
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục hành trình đọc và quản lý mượn sách."
    >
      <form onSubmit={handleSubmit(submit)} className="stack">
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Mật khẩu" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang kiểm tra…' : 'Đăng nhập'}
        </Button>
        <p className="form-foot">
          Chưa có tài khoản? <Link to="/register">Đăng ký làm độc giả</Link>
        </p>
      </form>
    </AuthFrame>
  );
}
export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });
  const submit = async (v: z.infer<typeof registerSchema>) => {
    try {
      await api.post('/auth/register', v);
      navigate('/login', { state: { registered: true } });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể tạo tài khoản.');
    }
  };
  return (
    <AuthFrame
      title="Mở thẻ thư viện"
      subtitle="Tạo tài khoản độc giả để đặt mượn và theo dõi sách đang giữ."
    >
      <form onSubmit={handleSubmit(submit)} className="stack">
        {error && <Notice tone="error">{error}</Notice>}
        <div className="form-grid">
          <Field label="Họ" error={errors.firstName?.message}>
            <Input {...register('firstName')} />
          </Field>
          <Field label="Tên" error={errors.lastName?.message}>
            <Input {...register('lastName')} />
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register('email')} />
        </Field>
        <Field label="Số điện thoại">
          <Input {...register('phone')} />
        </Field>
        <Field label="Mật khẩu" hint="Tối thiểu 6 ký tự" error={errors.password?.message}>
          <Input type="password" {...register('password')} />
        </Field>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang tạo…' : 'Tạo tài khoản'}
        </Button>
        <p className="form-foot">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </AuthFrame>
  );
}
function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-wrap">
      <div className="auth-aside">
        <span className="eyebrow">THƯ VIỆN HỌC THUẬT</span>
        <h1>
          Đọc sâu.
          <br />
          <i>Đi xa hơn.</i>
        </h1>
        <p>Một không gian yên tĩnh để tìm thấy những ý tưởng đáng giữ lại.</p>
        <div className="aside-note">
          “Một căn phòng không có sách giống như một thân thể không có linh hồn.”
          <br />
          <small>— Cicero</small>
        </div>
      </div>
      <div className="auth-card">
        <Link to="/catalog" className="back-link">
          ← Về catalog
        </Link>
        <span className="eyebrow">TÀI KHOẢN ĐỘC GIẢ</span>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
