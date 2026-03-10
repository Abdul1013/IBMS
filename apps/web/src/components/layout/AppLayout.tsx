import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  CheckSquare,
  BarChart2,
  Tag,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import AISummaryButton from '../ai/AISummaryButton';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  children: React.ReactNode;
  /** Optional search bar rendered in the top-right of the header */
  search?: React.ReactNode;
}

const navLink =
  'flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors';
const activeClass = 'bg-primary/10 text-primary';
const inactiveClass = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

function NavLinks({ role }: { role: string }) {
  if (role === 'STUDENT') {
    return (
      <NavLink
        to="/feed"
        className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
      >
        <LayoutDashboard className="w-4 h-4" /> Feed
      </NavLink>
    );
  }

  if (role === 'STAFF') {
    return (
      <>
        <NavLink
          to="/feed"
          className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
        >
          <LayoutDashboard className="w-4 h-4" /> Feed
        </NavLink>
        <NavLink
          to="/my-posts"
          className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
        >
          <FileText className="w-4 h-4" /> My Posts
        </NavLink>
      </>
    );
  }

  if (role === 'DEPT_ADMIN') {
    return (
      <>
        <NavLink
          to="/feed"
          className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
        >
          <LayoutDashboard className="w-4 h-4" /> Feed
        </NavLink>
        <NavLink
          to="/my-posts"
          className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
        >
          <FileText className="w-4 h-4" /> My Posts
        </NavLink>
        <NavLink
          to="/admin/pending"
          className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
        >
          <CheckSquare className="w-4 h-4" /> Approval Queue
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
        >
          <BarChart2 className="w-4 h-4" /> Analytics
        </NavLink>
        <NavLink
          to="/post/new"
          className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
        >
          <FileText className="w-4 h-4" /> Create Post
        </NavLink>
      </>
    );
  }

  // SYSTEM_ADMIN
  return (
    <>
      <NavLink
        to="/feed"
        className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
      >
        <LayoutDashboard className="w-4 h-4" /> Feed
      </NavLink>
      <NavLink
        to="/admin"
        className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
      >
        <BarChart2 className="w-4 h-4" /> Analytics
      </NavLink>
      <NavLink
        to="/admin/users"
        className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
      >
        <Users className="w-4 h-4" /> Users
      </NavLink>
      <NavLink
        to="/admin/pending"
        className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
      >
        <CheckSquare className="w-4 h-4" /> Approval Queue
      </NavLink>
      <NavLink
        to="/admin/categories"
        className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
      >
        <Tag className="w-4 h-4" /> Categories
      </NavLink>
      <NavLink
        to="/post/new"
        className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
      >
        <FileText className="w-4 h-4" /> Create Post
      </NavLink>
      <NavLink
        to="/my-posts"
        className={({ isActive }) => `${navLink} ${isActive ? activeClass : inactiveClass}`}
      >
        <FileText className="w-4 h-4" /> My Posts
      </NavLink>
    </>
  );
}

function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials =
    user?.name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '??';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Account menu"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {user?.role}
            </span>
          </div>

          {/* Admin section */}
          {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'DEPT_ADMIN') && (
            <>
              <div className="px-4 pt-2 pb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</p>
              </div>
              <button
                onClick={() => {
                  navigate('/admin');
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <BarChart2 className="w-4 h-4 text-gray-400" /> Analytics
              </button>
              <button
                onClick={() => {
                  navigate('/admin/pending');
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <CheckSquare className="w-4 h-4 text-gray-400" /> Approval Queue
              </button>
              <button
                onClick={() => {
                  navigate('/post/new');
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 text-gray-400" /> Create Post
              </button>
              {user?.role === 'SYSTEM_ADMIN' && (
                <>
                  <button
                    onClick={() => {
                      navigate('/admin/users');
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Users className="w-4 h-4 text-gray-400" /> Users
                  </button>
                  <button
                    onClick={() => {
                      navigate('/admin/categories');
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Tag className="w-4 h-4 text-gray-400" /> Categories
                  </button>
                </>
              )}
              <div className="border-t border-gray-100 mt-1" />
            </>
          )}

          {/* Account */}
          <div className="px-4 pt-2 pb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account</p>
          </div>
          <button
            onClick={() => {
              navigate('/profile');
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <User className="w-4 h-4 text-gray-400" /> Profile
          </button>
          <button
            onClick={() => {
              void logout();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children, search }: Props) {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2 shrink-0 mr-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">IB</span>
            </div>
            <span className="text-sm font-bold text-gray-900 hidden sm:block">IBMS</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {user && <NavLinks role={user.role} />}
          </nav>

          {/* Search slot */}
          {search && <div className="flex-1 max-w-sm hidden md:block">{search}</div>}

          {/* Right side */}
          <div className="flex items-center gap-1 ml-auto">
            <NotificationBell />
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* AI Summary floating button */}
      <AISummaryButton />
    </div>
  );
}
