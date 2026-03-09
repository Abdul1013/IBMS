import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({ cloud_url: env.CLOUDINARY_URL });

export { cloudinary };
