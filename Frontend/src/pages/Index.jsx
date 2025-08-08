import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast.jsx";
import { TrendingUp, Users, DollarSign, BarChart3, AlertCircle, RefreshCw } from "lucide-react";

const Index = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data from backend
  const fetchDashboardData = async () => {
    if (!token) return;
    
    setDataLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/home', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          toast({
            description: "Session expired. Please log in again.",
            variant: "destructive",
          });
          await logout();
          navigate("/");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      toast({
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        description: "Error during logout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to continue</h1>
          <Button onClick={() => navigate("/")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-facebook-50 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back, {user.username}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's your investment overview
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={dataLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/teams")}
            >
              View Teams
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
            >
              Profile
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error loading data</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="ml-auto"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loading State */}
        {dataLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        {!dataLoading && dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Amount
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardData.stats.totalAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total investment amount
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Deposited Amount
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardData.stats.depositedAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total deposits made
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Amount
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardData.stats.netAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total minus withdrawals
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Withdrawn Amount
                  </CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardData.stats.withdrawnAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total withdrawals
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Recent Activity */}
        {!dataLoading && dashboardData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.action === 'Deposit' ? 'bg-green-500' :
                          activity.action === 'Withdrawal' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            ${activity.amount.toFixed(2)}
                          </span>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.time).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Index; 