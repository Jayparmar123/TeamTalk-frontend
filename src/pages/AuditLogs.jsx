import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import {
  FiClock,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar.jsx";
import { fetchAdminAuditLogs } from "../store/slices/adminSlice.js";

const AuditLogs = () => {
  const dispatch = useDispatch();
  const { auditLogs, totalLogs, logsPages, loadingLogs } = useSelector(
    (state) => state.admin,
  );
  const [currentPage, setCurrentPage] = useState(1);

  const tableRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAdminAuditLogs({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  // GSAP animation for log rows
  useEffect(() => {
    if (!loadingLogs && auditLogs.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".log-row",
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.04,
          },
        );
      }, tableRef);
      return () => ctx.revert();
    }
  }, [loadingLogs, auditLogs.length]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < logsPages) setCurrentPage((prev) => prev + 1);
  };

  // Get color badges for different actions
  const getActionBadge = (action) => {
    const maps = {
      MEMBER_ADD: "bg-green-500/10 text-green-500 border-green-500/20",
      MEMBER_REMOVE: "bg-red-500/10 text-red-500 border-red-500/20",
      MEMBER_DEACTIVATE:
        "bg-orange-500/10 text-orange-500 border-orange-500/20",
      MEMBER_REACTIVATE:
        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      ROLE_CHANGE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      MEMBER_UPDATE: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    };
    const style =
      maps[action] || "bg-gray-500/10 text-gray-500 border-gray-500/20";

    return (
      <span
        className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${style}`}
      >
        {action.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <FiShield className="text-primary" />
            Security Audit Logs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mt-1">
            Immutable workspace logs tracking administrator and system
            operations.
          </p>
        </div>

        {/* Audit Log Table Card */}
        <div
          ref={tableRef}
          className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-dark-border text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  <th className="py-4.5 px-6">Timestamp</th>
                  <th className="py-4.5 px-6">Actor Details</th>
                  <th className="py-4.5 px-6 text-center">Operation</th>
                  <th className="py-4.5 px-6">Target Record</th>
                  <th className="py-4.5 px-6">Action Details</th>
                  <th className="py-4.5 px-6 text-center">Client IP</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p className="text-xs font-semibold">
                          Loading Audit Records...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      No security audit records logged in database.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const date = new Date(log.createdAt).toLocaleString();
                    return (
                      <tr
                        key={log._id}
                        className="log-row border-b border-gray-200 dark:border-dark-border/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        {/* Timestamp */}
                        <td className="py-4 px-6 font-mono text-[11px] shrink-0">
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <FiClock size={12} />
                            {date}
                          </span>
                        </td>

                        {/* Actor details */}
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900 dark:text-dark-text">
                            {log.actor?.name || "Deleted Actor"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {log.actor?.email || ""}
                          </p>
                        </td>

                        {/* Operation key */}
                        <td className="py-4 px-6 text-center">
                          {getActionBadge(log.action)}
                        </td>

                        {/* Target email */}
                        <td className="py-4 px-6 truncate font-mono text-[11px] max-w-[150px] text-gray-800 dark:text-gray-400">
                          {log.target || "N/A"}
                        </td>

                        {/* Action Details */}
                        <td className="py-4 px-6 text-gray-800 dark:text-gray-400 leading-relaxed max-w-[200px] break-words">
                          {log.details}
                        </td>

                        {/* Client IP Address */}
                        <td className="py-4 px-6 text-center font-mono text-[11px] text-gray-400">
                          {log.ipAddress || "127.0.0.1"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {logsPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Page {currentPage} of {logsPages} ({totalLogs} records)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loadingLogs}
                  className="p-2 border border-gray-200 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
                >
                  <FiChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === logsPages || loadingLogs}
                  className="p-2 border border-gray-200 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuditLogs;
