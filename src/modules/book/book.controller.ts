import { Request, Response } from 'express';
import { bookService } from './book.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

export class BookController {
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const book = await bookService.create(req.body);
    ApiResponse.created(res, book, 'Tạo sách thành công');
  });

  findAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { search, categoryId, available, page, limit, sortBy, sortOrder } = req.query;
    const result = await bookService.findAll({
      search: search as string,
      categoryId: categoryId as string,
      available: available === 'true',
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
    ApiResponse.success(res, result.books, 'Thành công', 200, result.pagination);
  });

  findById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const book = await bookService.findById(req.params.id as string);
    ApiResponse.success(res, book);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const book = await bookService.update(req.params.id as string, req.body);
    ApiResponse.success(res, book, 'Cập nhật sách thành công');
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await bookService.softDelete(req.params.id as string);
    ApiResponse.success(res, null, 'Xóa sách thành công');
  });
}

export const bookController = new BookController();
