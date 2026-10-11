import { Request, Response } from 'express';
import { categoryService } from './category.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

export class CategoryController {
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const category = await categoryService.create(req.body);
    ApiResponse.created(res, category, 'Tạo danh mục thành công');
  });

  findAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { search, page, limit } = req.query;
    const result = await categoryService.findAll({
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    ApiResponse.success(res, result.categories, 'Thành công', 200, result.pagination);
  });

  findById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const category = await categoryService.findById(req.params.id as string);
    ApiResponse.success(res, category);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const category = await categoryService.update(req.params.id as string, req.body);
    ApiResponse.success(res, category, 'Cập nhật danh mục thành công');
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await categoryService.delete(req.params.id as string);
    ApiResponse.success(res, null, 'Xóa danh mục thành công');
  });
}

export const categoryController = new CategoryController();
