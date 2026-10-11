import { Request, Response } from 'express';
import { bookCopyService } from './book-copy.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

export class BookCopyController {
  addCopies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await bookCopyService.addCopies(req.params.bookId as string, req.body);
    ApiResponse.created(res, result, `Đã thêm ${result.count} bản sao`);
  });

  findByBook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const copies = await bookCopyService.findByBook(req.params.bookId as string);
    ApiResponse.success(res, copies);
  });

  findByBarcode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const copy = await bookCopyService.findByBarcode(req.params.barcode as string);
    ApiResponse.success(res, copy);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const copy = await bookCopyService.update(req.params.id as string, req.body);
    ApiResponse.success(res, copy, 'Cập nhật bản sao thành công');
  });
}

export const bookCopyController = new BookCopyController();
