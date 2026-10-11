import { Role } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}
