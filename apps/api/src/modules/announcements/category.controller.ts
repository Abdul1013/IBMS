import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as CategoryService from './category.service';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await CategoryService.listCategories();
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await CategoryService.createCategory(req.body);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await CategoryService.updateCategory(req.params['id'] as string, req.body);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await CategoryService.deleteCategory(req.params['id'] as string);
  res.json({ success: true, data: { message: 'Category deactivated' } });
});
