import { Category } from '../../models/Category.model';
import { redis } from '../../config/redis';
import { AppError } from '../../utils/AppError';
import type { CreateCategoryDto, UpdateCategoryDto } from './category.dto';

const CACHE_KEY = 'categories:all';
const CACHE_TTL = 60 * 5;

const bustCache = () => redis.del(CACHE_KEY);

export const listCategories = async () => {
  const cached = await redis.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const cats = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(cats));
  return cats;
};

export const createCategory = async (dto: CreateCategoryDto) => {
  const slug = dto.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const exists = await Category.findOne({ slug });
  if (exists)
    throw new AppError('Category with this name already exists', 409, 'DUPLICATE_CATEGORY');

  const cat = await Category.create({ ...dto, slug });
  await bustCache();
  return cat;
};

export const updateCategory = async (id: string, dto: UpdateCategoryDto) => {
  const cat = await Category.findByIdAndUpdate(id, dto, { new: true });
  if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');
  await bustCache();
  return cat;
};

export const deleteCategory = async (id: string) => {
  const cat = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');
  await bustCache();
};
