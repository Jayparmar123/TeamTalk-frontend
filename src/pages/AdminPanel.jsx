import { useEffect, useState } from "react";
import {
  FiUsers,
  FiMessageSquare,
  FiActivity,
  FiUserPlus,
  FiTrash2,
  FiShield,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar.jsx";
import {
  fetchAdminUsers,
  adminAddUser,
  adminUpdateUser,
  adminDeleteUser,
  fetchAdminAnalytics,
} from "../store/slices/adminSlice.js";
import { AnalyticsSkeleton } from "../components/common/Loading.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

const AdminPanel = () => {
  const dispatch = useDispatch();
  const { users, analytics, loadingUsers, loadingAnalytics } = useSelector(
    (state) => state.admin,
  );
  const { user: currentUser } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Add User Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchAdminUsers());
    dispatch(fetchAdminAnalytics());
  }, [dispatch]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name || !email || !password) {
      setFormError("Please fill out all fields");
      showToast("Please fill out all fields", "warning");
      return;
    }

    const actionResult = await dispatch(
      adminAddUser({ name, email, password, role }),
    );

    if (adminAddUser.fulfilled.match(actionResult)) {
      // Clear forms and close toggle
      setName("");
      setEmail("");
      setPassword("");
      setRole("employee");
      setShowAddForm(false);
      showToast("Employee registered successfully!", "success");
      dispatch(fetchAdminAnalytics()); // Refresh analytics
    } else {
      const errorMsg = actionResult.payload || "Failed to register employee";
      setFormError(errorMsg);
      showToast(errorMsg, "error");
    }
  };

  const handleRoleToggle = async (user) => {
    if (user._id === currentUser.id) {
      showToast("You cannot change your own role.", "warning");
      return;
    }
    const newRole = user.role === "admin" ? "employee" : "admin";
    const isConfirmed = await confirm(
      `Are you sure you want to change the role of ${user.name} from ${user.role} to ${newRole}?`,
      'Modify Permissions',
      'Change Role',
      'Cancel'
    );
    if (isConfirmed) {
      const actionResult = await dispatch(
        adminUpdateUser({ id: user._id, updateData: { role: newRole } }),
      );
      if (adminUpdateUser.fulfilled.match(actionResult)) {
        showToast(`Role for ${user.name} changed to ${newRole} successfully.`, "success");
      } else {
        showToast(actionResult.payload || "Failed to update role.", "error");
      }
    }
  };

  const handleStatusToggle = async (user) => {
    if (user._id === currentUser.id) {
      showToast("You cannot deactivate your own admin session.", "warning");
      return;
    }
    const newStatus = !user.isActive;
    const actionText = newStatus ? "Reactivate" : "Deactivate / Soft Delete";
    const isConfirmed = await confirm(
      `Are you sure you want to ${newStatus ? 'reactivate' : 'deactivate'} the account of ${user.name}?`,
      `${actionText} Account`,
      newStatus ? 'Reactivate' : 'Deactivate',
      'Cancel'
    );
    if (isConfirmed) {
      const actionResult = await dispatch(
        adminUpdateUser({ id: user._id, updateData: { isActive: newStatus } }),
      );
      if (adminUpdateUser.fulfilled.match(actionResult)) {
        showToast(`Account for ${user.name} is now ${newStatus ? "active" : "inactive"}.`, "success");
        dispatch(fetchAdminAnalytics()); // Refresh analytics
      } else {
        showToast(actionResult.payload || `Failed to update account status.`, "error");
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (user._id === currentUser.id) {
      showToast("You cannot delete your own admin account.", "warning");
      return;
    }
    const isConfirmed = await confirm(
      `⚠️ WARNING: This will permanently remove ${user.name} and delete all related database logs. This action cannot be undone. Proceed?`,
      'Delete Member Permanently',
      'Delete User',
      'Cancel'
    );
    if (isConfirmed) {
      const actionResult = await dispatch(adminDeleteUser(user._id));
      if (adminDeleteUser.fulfilled.match(actionResult)) {
        showToast(`Permanently deleted employee ${user.name} successfully.`, "success");
        dispatch(fetchAdminAnalytics()); // Refresh analytics
      } else {
        showToast(actionResult.payload || "Failed to delete employee.", "error");
      }
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text transition-colors duration-300"
    >
      {/* Top Navbar */}
      <Navbar />

      {/* Main Admin Content Frame */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Title Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Admin Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mt-1">
              Manage office directory and view chat statistics.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <FiUserPlus size={18} />
            {showAddForm ? "Close Registration" : "Add Employee"}
          </button>
        </div>

        {/* Collapsible Add User Form */}
        {showAddForm && (
          <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-xl space-y-4 animate-fade-in">
            <h3 className="font-extrabold text-lg">
              Register New Office Employee
            </h3>
            {formError && (
              <p className="text-xs text-red-500 font-semibold bg-red-500/10 p-3 rounded-lg border border-red-500/10">
                {formError}
              </p>
            )}
            <form
              onSubmit={handleAddUser}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border bg-gray-50 dark:bg-dark-bg/60 border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@office.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border bg-gray-50 dark:bg-dark-bg/60 border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border bg-gray-50 dark:bg-dark-bg/60 border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border bg-gray-50 dark:bg-dark-bg/60 border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-primary"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent-indigo text-white font-bold text-sm shadow-md"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Analytics Statistics Panel */}
        {loadingAnalytics ? (
          <AnalyticsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card animate-card-enter p-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Total Employees
                </p>
                <h4 className="text-3xl font-black mt-2 text-gray-900 dark:text-dark-text">
                  {analytics.totalEmployees}
                </h4>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <FiUsers size={22} />
              </div>
            </div>

            <div className="stat-card animate-card-enter-d1 p-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Online Employees
                </p>
                <h4 className="text-3xl font-black mt-2 text-accent-green glow-text-emerald">
                  {analytics.onlineCount}
                </h4>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-accent-green/10 flex items-center justify-center text-accent-green">
                <FiActivity size={22} />
              </div>
            </div>

            <div className="stat-card animate-card-enter-d2 p-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Active Chats
                </p>
                <h4 className="text-3xl font-black mt-2 text-gray-900 dark:text-dark-text">
                  {analytics.activeChats}
                </h4>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                <FiMessageSquare size={22} />
              </div>
            </div>

            <div className="stat-card animate-card-enter-d3 p-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Total Messages
                </p>
                <h4 className="text-3xl font-black mt-2 text-gray-900 dark:text-dark-text">
                  {analytics.totalMessages}
                </h4>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-accent-rose/10 flex items-center justify-center text-accent-rose">
                <FiMessageSquare size={22} />
              </div>
            </div>
          </div>
        )}

        {/* User Management Table Grid */}
        <div className="admin-grid animate-fade-up rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-dark-border">
            <h3 className="font-extrabold text-lg">
              Employee Member Directory
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-semibold">
              Change permissions, deactivate users, or delete account histories.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-dark-border text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  <th className="py-4 px-6">Member details</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">System Access</th>
                  <th className="py-4 px-6 text-center">Role / Permissions</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers && users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      Loading Directory Listings...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      No registered members found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors"
                    >
                      {/* Name Details */}
                      <td className="py-4.5 px-6 flex items-center gap-3">
                        <img
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                          }
                          alt={user.name}
                          className="h-10 w-10 rounded-xl object-cover bg-gray-200 dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 dark:text-dark-text truncate">
                            {user.name}
                            {user._id === currentUser.id && (
                              <span className="ml-2 text-[9px] bg-primary/10 text-primary dark:text-primary-light font-extrabold px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4.5 px-6 font-semibold text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </td>

                      {/* Online status */}
                      <td className="py-4.5 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            user.isOnline
                              ? "bg-accent-green/10 text-accent-green glow-text-emerald"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${user.isOnline ? "bg-accent-green" : "bg-gray-400"}`}
                          ></span>
                          {user.isOnline ? "Online" : "Offline"}
                        </span>
                      </td>

                      {/* Account active status */}
                      <td className="py-4.5 px-6 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            user.isActive
                              ? "bg-accent-green/15 text-accent-green"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {user.isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      {/* Role toggle */}
                      <td className="py-4.5 px-6 text-center">
                        <button
                          onClick={() => handleRoleToggle(user)}
                          disabled={user._id === currentUser.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                            user.role === "admin"
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <FiShield size={14} />
                          {user.role === "admin" ? "Admin" : "Employee"}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Active / Inactive switch */}
                          <button
                            onClick={() => handleStatusToggle(user)}
                            disabled={user._id === currentUser.id}
                            title={
                              user.isActive
                                ? "Deactivate Employee"
                                : "Reactivate Employee"
                            }
                            className={`p-2 rounded-xl transition-all disabled:opacity-50 ${
                              user.isActive
                                ? "text-accent-green hover:bg-accent-green/10"
                                : "text-red-500 hover:bg-red-500/10"
                            }`}
                          >
                            {user.isActive ? (
                              <FiToggleRight size={22} />
                            ) : (
                              <FiToggleLeft size={22} />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={user._id === currentUser.id}
                            title="Delete Permanently"
                            className="p-2 text-red-500 hover:bg-red-500/15 rounded-xl transition-all disabled:opacity-50"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
