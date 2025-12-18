import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, ShoppingBag, Gift, Users, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import type { Order, LoyaltyTransaction, Referral } from "@shared/schema";

export default function Account() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, logout, loading } = useAuth();

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", user?.id],
    enabled: !!user,
  });

  const { data: loyaltyTransactions } = useQuery<LoyaltyTransaction[]>({
    queryKey: ["/api/loyalty/transactions", user?.id],
    enabled: !!user,
  });

  const { data: referrals } = useQuery<Referral[]>({
    queryKey: ["/api/referrals", user?.id],
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      assigned: "outline",
      in_progress: "default",
      completed: "default",
      cancelled: "destructive",
    };
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      in_progress: "bg-primary/10 text-primary",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {t(`account.orderStatus.${status}`)}
      </span>
    );
  };

  const getTransactionBadge = (type: string) => {
    const colors: Record<string, string> = {
      earn: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      redeem: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      referral_bonus: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      welcome_bonus: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      admin_adjustment: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    const labels: Record<string, string> = {
      earn: t("loyalty.earned"),
      redeem: t("loyalty.redeemed"),
      referral_bonus: t("loyalty.bonus"),
      welcome_bonus: t("loyalty.bonus"),
      admin_adjustment: getLocalizedText("تعديل", "Adjustment", "Ajustement"),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.earn}`}>
        {labels[type]}
      </span>
    );
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t("account.title")}</h1>
          <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
            <LogOut className="h-4 w-4 me-2" />
            {t("nav.logout")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Gift className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{user.loyaltyPoints || 0}</p>
              <p className="text-sm text-muted-foreground">{t("loyalty.points")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-chart-1" />
              <p className="text-2xl font-bold">{orders?.length || 0}</p>
              <p className="text-sm text-muted-foreground">{t("account.orders")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-chart-3" />
              <p className="text-2xl font-bold">{referrals?.filter(r => r.status === "completed").length || 0}</p>
              <p className="text-sm text-muted-foreground">{t("friendsClub.successfulReferrals")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <User className="h-8 w-8 mx-auto mb-2 text-chart-4" />
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="orders" data-testid="tab-orders">
              <ShoppingBag className="h-4 w-4 me-2 hidden sm:inline" />
              {t("account.orders")}
            </TabsTrigger>
            <TabsTrigger value="loyalty" data-testid="tab-loyalty">
              <Gift className="h-4 w-4 me-2 hidden sm:inline" />
              {t("account.loyalty")}
            </TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-referrals">
              <Users className="h-4 w-4 me-2 hidden sm:inline" />
              {t("account.referrals")}
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              <Settings className="h-4 w-4 me-2 hidden sm:inline" />
              {t("account.profile")}
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t("account.orders")}</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : orders?.length ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4" data-testid={`order-${order.id}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(order.status)}
                            <span className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
                          </div>
                          <p className="font-medium">{order.area}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(i18n.language)}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-lg font-bold text-primary">{order.priceKD} {t("services.kd")}</p>
                          {order.loyaltyPointsEarned > 0 && (
                            <p className="text-sm text-green-600">+{order.loyaltyPointsEarned} {t("loyalty.points")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">{t("common.noData")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span>{t("loyalty.history")}</span>
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {user.loyaltyPoints || 0} {t("loyalty.points")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loyaltyTransactions?.length ? (
                  <div className="space-y-3">
                    {loyaltyTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`transaction-${tx.id}`}>
                        <div className="flex items-center gap-3">
                          {getTransactionBadge(tx.type)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString(i18n.language)}
                          </span>
                        </div>
                        <span className={`font-bold ${tx.pointsChange > 0 ? "text-green-600" : "text-red-600"}`}>
                          {tx.pointsChange > 0 ? "+" : ""}{tx.pointsChange}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">{t("common.noData")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>{t("friendsClub.title")}</CardTitle>
                <CardDescription>{t("friendsClub.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Label className="text-sm font-medium">{t("friendsClub.yourCode")}</Label>
                  <p className="text-2xl font-mono font-bold text-primary mt-1">{user.referralCode}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">{t("friendsClub.stats")}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-2xl font-bold">{referrals?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">{t("friendsClub.totalReferrals")}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-2xl font-bold">{referrals?.filter(r => r.status === "completed").length || 0}</p>
                      <p className="text-sm text-muted-foreground">{t("friendsClub.successfulReferrals")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t("account.editProfile")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("account.name")}</Label>
                    <Input defaultValue={user.name} data-testid="input-profile-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("account.email")}</Label>
                    <Input defaultValue={user.email} disabled dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("account.phone")}</Label>
                    <Input defaultValue={user.phone || ""} dir="ltr" data-testid="input-profile-phone" />
                  </div>
                </div>
                <Button data-testid="button-save-profile">{t("account.save")}</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
