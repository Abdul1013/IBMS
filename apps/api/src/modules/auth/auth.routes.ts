import { Router } from 'express';
import * as AuthController from './auth.controller';
import { validate } from '../../middleware/validate';
import { verifyToken } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from './auth.dto';

const router = Router();

router.use(authLimiter);

router.post('/register', validate(RegisterSchema), AuthController.register);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/login', validate(LoginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', verifyToken, AuthController.logout);
router.post('/forgot-password', validate(ForgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(ResetPasswordSchema), AuthController.resetPassword);
router.get('/me', verifyToken, AuthController.getMe);
router.patch('/me', verifyToken, AuthController.updateProfile);

export default router;
