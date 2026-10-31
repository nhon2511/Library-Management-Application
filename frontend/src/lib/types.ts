export type Role = 'READER' | 'LIBRARIAN' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type Book = {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  publishedYear?: number;
  description?: string;
  coverImageUrl?: string;
  price: number;
  totalCopies: number;
  availableCopies: number;
  categoryId: string;
  category?: { id: string; name: string; slug?: string };
  copies?: { id: string; barcode: string; status: string; shelfLocation?: string }[];
};
export type Category = { id: string; name: string; slug: string; description?: string };
export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  qrCode?: string;
  createdAt?: string;
};
export type Borrow = {
  id: string;
  status: string;
  borrowDate?: string;
  dueDate?: string;
  returnDate?: string;
  renewCount: number;
  user?: User;
  items: {
    id: string;
    bookCopyId: string;
    status: string;
    bookCopy: { id: string; barcode: string; shelfLocation?: string; status: string; book: Book };
  }[];
  fines?: Fine[];
};
export type Fine = {
  id: string;
  type: string;
  status: string;
  amount: number;
  reason?: string;
  createdAt: string;
  user?: User;
  paymentMethod?: string;
  waivedReason?: string;
};
export type Pagination = { page: number; limit: number; total: number; totalPages: number };
export type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  pagination?: Pagination;
};
