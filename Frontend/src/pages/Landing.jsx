import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { X, Lock, User, Mail, Phone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { useToast } from "@/components/ui/use-toast.jsx";

const Landing = () => {
  const navigate = useNavigate();
  const { register, sendOTP, verifyOTP, login } = useAuth();
  const { toast } = useToast();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [signupForm, setSignupForm] = useState({
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loginForm, setLoginForm] = useState({
    usernameOrPhone: "",
    password: ""
  });

  const [otpForm, setOtpForm] = useState({
    otp: ""
  });

  const closeModals = () => {
    setShowSignup(false);
    setShowLogin(false);
    setShowOTP(false);
    setSignupForm({ username: "", phone: "", email: "", password: "", confirmPassword: "" });
    setLoginForm({ usernameOrPhone: "", password: "" });
    setOtpForm({ otp: "" });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(
        signupForm.username,
        signupForm.phone,
        signupForm.email,
        signupForm.password,
        signupForm.confirmPassword
      );
      toast({
        description: "Registration successful! Please verify your OTP.",
        className: "bg-green-500 text-white",
      });
      setShowOTP(true);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await sendOTP(signupForm.phone);
      toast({
        description: "OTP sent successfully!",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP(signupForm.phone, otpForm.otp);
      toast({
        description: "Account verified successfully!",
        className: "bg-green-500 text-white",
      });
      closeModals();
      navigate("/home");
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "OTP verification failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.usernameOrPhone, loginForm.password);
      toast({
        description: "Logged in successfully!",
        className: "bg-green-500 text-white",
      });
      closeModals();
      navigate("/home");
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-facebook-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-64 h-64 bg-facebook-200 rounded-full opacity-20 -top-32 -left-32"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-facebook-300 rounded-full opacity-20 -bottom-48 -right-48"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Logo and Welcome Text */}
      <div className="text-center mb-12 relative">
        <motion.img
          src="/logo.png"
          alt="Solar Growth Logo"
          className="h-20 w-auto mb-6 mx-auto"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.h1
          className="text-3xl font-bold text-gray-800 mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Welcome to Solar Growth
        </motion.h1>
        <motion.p
          className="text-gray-600 max-w-md"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Join us to start your investment journey and grow your wealth sustainably
        </motion.p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md z-10">
        <motion.div
          className="flex-1"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            className="w-full bg-facebook-600 hover:bg-facebook-700 text-white py-6 text-lg"
            onClick={() => setShowSignup(true)}
            disabled={loading}
          >
            Sign Up
          </Button>
        </motion.div>
        <motion.div
          className="flex-1"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            className="w-full bg-white hover:bg-gray-50 text-facebook-600 border-2 border-facebook-600 py-6 text-lg"
            onClick={() => setShowLogin(true)}
            disabled={loading}
          >
            Login
          </Button>
        </motion.div>
      </div>

      {/* Signup Modal */}
      <AnimatePresence>
        {showSignup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={closeModals}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardContent className="pt-8">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Username"
                        className="pl-10"
                        value={signupForm.username}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, username: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Phone Number"
                        className="pl-10"
                        value={signupForm.phone}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="Email Address"
                          className="pl-10"
                          value={signupForm.email}
                          onChange={(e) =>
                            setSignupForm({ ...signupForm, email: e.target.value })
                          }
                          required
                        />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Password"
                        className="pl-10"
                        value={signupForm.password}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Confirm Password"
                        className="pl-10"
                        value={signupForm.confirmPassword}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-facebook-600 hover:bg-facebook-700 text-white"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {showOTP && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={closeModals}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardContent className="pt-8">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Verify Your Phone</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Enter the 6-digit code sent to {signupForm.phone}
                  </p>
                </div>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        placeholder="Enter 6-digit OTP"
                        className="text-center text-lg tracking-widest"
                        value={otpForm.otp}
                        onChange={(e) =>
                          setOtpForm({ ...otpForm, otp: e.target.value })
                        }
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-facebook-600 hover:bg-facebook-700 text-white"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    Resend OTP
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={closeModals}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardContent className="pt-8">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Username or Phone Number"
                        className="pl-10"
                        value={loginForm.usernameOrPhone}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, usernameOrPhone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Password"
                        className="pl-10"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-facebook-600 hover:bg-facebook-700 text-white"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing; 