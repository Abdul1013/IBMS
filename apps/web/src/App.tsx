import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './router/ProtectedRoute';

// Route-level code splitting — each page loads only when navigated to
const LandingPage = lazy(() => import('./pages/Landing'));
const LoginPage = lazy(() => import('./pages/auth/Login'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLogin'));
const RegisterPage = lazy(() => import('./pages/auth/Register'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmail'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword'));
const Feed = lazy(() => import('./pages/student/Feed'));
const Detail = lazy(() => import('./pages/student/Detail'));
const PostAnnouncement = lazy(() => import('./pages/staff/PostAnnouncement'));
const EditAnnouncement = lazy(() => import('./pages/staff/EditAnnouncement'));
const MyPosts = lazy(() => import('./pages/staff/MyPosts'));
const ApprovalQueuePage = lazy(() => import('./pages/admin/ApprovalQueue'));
const UsersPage = lazy(() => import('./pages/admin/Users'));
const AnalyticsPage = lazy(() => import('./pages/admin/Analytics'));
const CategoriesPage = lazy(() => import('./pages/admin/Categories'));
const ProfilePage = lazy(() => import('./pages/Profile'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
  </div>
);

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Announcement detail — any authenticated user */}
          <Route
            path="/announcements/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN']}>
                <Detail />
              </ProtectedRoute>
            }
          />

          {/* Bulletin feed — all roles */}
          <Route
            path="/feed"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN']}>
                <Feed />
              </ProtectedRoute>
            }
          />

          {/* Staff / Admin posting */}
          <Route
            path="/post/new"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN']}>
                <PostAnnouncement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN']}>
                <EditAnnouncement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-posts"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN']}>
                <MyPosts />
              </ProtectedRoute>
            }
          />

          {/* Admin — analytics */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['DEPT_ADMIN', 'SYSTEM_ADMIN']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin — user management */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* Admin — approval queue */}
          <Route
            path="/admin/pending"
            element={
              <ProtectedRoute allowedRoles={['DEPT_ADMIN', 'SYSTEM_ADMIN']}>
                <ApprovalQueuePage />
              </ProtectedRoute>
            }
          />

          {/* Admin — category management */}
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />

          {/* Profile — all authenticated users */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
