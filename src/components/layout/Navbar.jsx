import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMessageSquare, FiTrendingUp, FiLogOut, FiSun, FiMoon, FiShield, FiCpu, FiChevronDown, FiArrowLeft } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext.jsx';
import { logoutUser, logoutAllDevices } from '../../store/slices/authSlice.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { setActiveConversation } from '../../store/slices/chatSlice.js';

const Navbar = ({ onBack }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { darkMode, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const isConfirmed = await confirm(
      'Are you sure you want to end your current session and log out?',
      'Logout Session',
      'Log Out',
      'Keep Session'
    );
    if (isConfirmed) {
      await dispatch(logoutUser());
      showToast('Logged out successfully.', 'info');
      navigate('/login');
    }
  };

  const handleLogoutAll = async () => {
    const isConfirmed = await confirm(
      'WARNING: This will immediately close all active sessions and log you out of all other browsers/devices. Proceed?',
      'Reset All Sessions',
      'Reset All',
      'Cancel'
    );
    if (isConfirmed) {
      const actionResult = await dispatch(logoutAllDevices());
      if (logoutAllDevices.fulfilled.match(actionResult)) {
        showToast('All active sessions reset successfully.', 'warning');
      } else {
        showToast(actionResult.payload || 'Sessions reset failed.', 'error');
      }
      navigate('/login');
    }
  };

  const navItems = [
    {
      to: '/',
      label: 'Chats',
      icon: <FiMessageSquare size={16} />,
      adminOnly: false,
      onClick: () => {
        dispatch(setActiveConversation(null));
        localStorage.removeItem('teamtalk_active_convo_id');
      },
    },
    {
      to: '/admin',
      label: 'Admin Panel',
      icon: <FiTrendingUp size={16} />,
      adminOnly: true,
      onClick: null,
    },
    {
      to: '/audit-logs',
      label: 'Audit Logs',
      icon: <FiShield size={16} />,
      adminOnly: true,
      onClick: null,
    }
  ];

  return (
    <header className="w-full h-16 shrink-0 flex items-center justify-between px-3 md:px-6 border-b bg-[#F8F9FC] border-gray-200 dark:bg-dark-card dark:border-dark-border text-gray-800 dark:text-dark-text transition-colors duration-300 z-30">
      {/* Left: Brand Logo (or Back button on mobile) */}
      <div className="flex items-center gap-3">
        {/* Mobile back arrow — only shown when a chat is open */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/40 text-gray-500 dark:text-gray-400 transition-all mr-1"
            aria-label="Back to chat list"
          >
            <FiArrowLeft size={20} />
          </button>
        )}
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent-indigo flex items-center justify-center text-white font-extrabold shadow-lg shadow-primary/20 shrink-0">
          OC
        </div>
        <div className="hidden sm:block">
          <h1 className="font-extrabold text-base leading-none tracking-tight bg-gradient-to-r from-primary to-accent-indigo bg-clip-text text-transparent">
            OfficeChat
          </h1>
          <p className="text-[9px] text-gray-400 font-bold tracking-wider uppercase mt-0.5">Workspace App</p>
        </div>
      </div>

      {/* Center: Navigation Pills */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          // Hide admin items if current user is not admin
          if (item.adminOnly && user?.role !== 'admin') return null;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={item.onClick || undefined}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light border-b-2 border-primary'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Right: Theme Toggle & Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300 transition-all active:scale-[0.96]"
        >
          {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>

        {/* User Dropdown wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/40 border border-transparent hover:border-gray-200 dark:hover:border-dark-border/40 transition-all"
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt={user?.name}
              className="h-8 w-8 rounded-lg object-cover bg-gray-200 dark:bg-gray-700 shadow-sm border border-gray-300 dark:border-gray-600"
            />
            <span className="hidden md:block font-bold text-xs max-w-[100px] truncate text-gray-700 dark:text-dark-text">
              {user?.name}
            </span>
            <FiChevronDown size={14} className="text-gray-400 dark:text-gray-400" />
          </button>

          {/* Profile Dropdown panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-2xl z-50 p-2 space-y-1 animate-fade-in text-left">
              {/* Header Profile Details */}
              <div className="px-3 py-2">
                <p className="font-extrabold text-xs text-gray-800 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                  {user?.role}
                </span>
              </div>

              <hr className="border-gray-200 dark:border-dark-border my-1" />

              {/* Reset Sessions */}
              <button
                onClick={() => { setDropdownOpen(false); handleLogoutAll(); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl font-bold text-[11px] text-orange-500 hover:bg-orange-500/10 transition-all text-left"
              >
                <FiCpu size={14} />
                Reset All Sessions
              </button>

              {/* Logout Session */}
              <button
                onClick={() => { setDropdownOpen(false); handleLogout(); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl font-bold text-[11px] text-red-500 hover:bg-red-500/10 transition-all text-left"
              >
                <FiLogOut size={14} />
                Logout Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
