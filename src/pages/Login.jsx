import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { loginUser, clearAuthError } from "../store/slices/authSlice.js";
import { useToast } from "../context/ToastContext.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  const isSessionExpired = searchParams.get("expired") === "true";

  // Clear errors on page load
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Handle session expiration toast alert on load
  useEffect(() => {
    if (isSessionExpired) {
      showToast("Your session expired. Please log in again.", "warning");
    }
  }, [isSessionExpired, showToast]);

  // Handle successful login redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const actionResult = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(actionResult)) {
      showToast(
        `Logged in successfully! Welcome, ${actionResult.payload.user.name}.`,
        "success",
      );
    } else if (loginUser.rejected.match(actionResult)) {
      showToast(
        actionResult.payload ||
          "Authentication failed. Please check your credentials.",
        "error",
      );
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden bg-dark-bg text-white">
      {/* Background Neon Glowing Orbs — CSS animated */}
      <div className="animate-glow-orb absolute top-[10%] left-[15%] w-96 h-96 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="animate-glow-orb-delayed absolute bottom-[10%] right-[15%] w-96 h-96 rounded-full bg-accent-indigo/20 blur-[100px] pointer-events-none" />

      {/* Login Form Container — CSS slide-up + fade */}
      <div className="animate-card-enter w-full max-w-md p-8 rounded-3xl glass-panel border border-white/10 z-10 shadow-2xl flex flex-col items-center">
        {/* Header Icon */}
        <div className="h-16 w-16 mb-4 rounded-2xl bg-gradient-to-tr from-primary to-accent-indigo flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/20">
          OC
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="text-sm text-gray-400 font-semibold mt-1.5 mb-6 uppercase tracking-wider">
          Office Directory Login
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Email input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <FiMail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@office.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-gray-800/40 border-gray-700/60 focus:border-primary text-white outline-none font-medium transition-all focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <FiLock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-gray-800/40 border-gray-700/60 focus:border-primary text-white outline-none font-medium transition-all focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-primary to-accent-indigo text-white font-extrabold text-sm tracking-widest uppercase hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
