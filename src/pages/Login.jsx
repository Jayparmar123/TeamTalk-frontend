import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { FiMail, FiLock } from "react-icons/fi";
import { loginUser, clearAuthError } from "../store/slices/authSlice.js";
import { useToast } from "../context/ToastContext.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector(
    (state) => state.auth,
  );
  const { showToast } = useToast();

  const containerRef = useRef(null);
  const cardRef = useRef(null);

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

  // GSAP Entrance Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in background gradients
      gsap.fromTo(
        ".bg-glow",
        { opacity: 0, scale: 0.6 },
        {
          opacity: 0.6,
          scale: 1,
          duration: 1.5,
          ease: "power2.out",
          stagger: 0.2,
        },
      );
      // Animating the login card
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 50, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.2)" },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    const actionResult = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(actionResult)) {
      showToast(`Logged in successfully! Welcome, ${actionResult.payload.user.name}.`, "success");
    } else if (loginUser.rejected.match(actionResult)) {
      showToast(actionResult.payload || "Authentication failed. Please check your credentials.", "error");
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden bg-dark-bg text-white"
    >
      {/* Background Neon Glowing Orbs */}
      <div className="bg-glow absolute top-[10%] left-[15%] w-96 h-96 rounded-full bg-primary/20 blur-[100px] pointer-events-none"></div>
      <div className="bg-glow absolute bottom-[10%] right-[15%] w-96 h-96 rounded-full bg-accent-indigo/20 blur-[100px] pointer-events-none"></div>

      {/* Login Form Container */}
      <div
        ref={cardRef}
        className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/10 z-10 shadow-2xl flex flex-col items-center"
      >
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

        {/* Seeder Helper Notice */}
        <div className="mt-8 pt-6 w-full border-t border-white/5 flex flex-col items-center gap-1.5 text-center">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Testing Credentials
          </p>
          <div className="text-xs text-gray-400 font-medium">
            <p>
              Admin:{" "}
              <span className="text-primary-light font-mono select-all">
                admin@office.com
              </span>{" "}
              | <span className="font-mono">admin123</span>
            </p>
            <p>
              User:{" "}
              <span className="text-primary-light font-mono select-all">
                john.doe@office.com
              </span>{" "}
              | <span className="font-mono">user123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
