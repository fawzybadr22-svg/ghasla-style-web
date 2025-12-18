import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Gift, FileText, 
  BarChart3, Shield, Settings, ChevronRight, TrendingUp, Pencil, Trash2,
  Plus, Ban, CheckCircle, Download, Eye, X, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { ServicePackage, Order, User, LoyaltyConfig, AuditLog } from "@shared/schema";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/:section");
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  
  const section = params?.section || "dashboard";

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  // Queries
  const { data: analytics } = useQuery<{
    totalIncome: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    newCustomers: number;
    pointsIssued: number;
    pointsRedeemed: number;
    referralCount: number;
  }>({
    queryKey: ["/api/admin/analytics"],
    enabled: isAdmin && section === "dashboard",
  });

  const { data: packages, isLoading: packagesLoading } = useQuery<ServicePackage[]>({
    queryKey: ["/api/admin/packages"],
    enabled: isAdmin && (section === "packages" || section === "dashboard"),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: isAdmin && (section === "orders" || section === "dashboard"),
  });

  const { data: customers, isLoading: customersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users?role=customer");
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: isAdmin && section === "customers",
  });

  const { data: loyaltyConfig } = useQuery<LoyaltyConfig>({
    queryKey: ["/api/loyalty/config"],
    enabled: isAdmin && section === "loyalty",
  });

  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
    enabled: isSuperAdmin && section === "audit",
  });

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, cancelReason }: { id: string; status: string; cancelReason?: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancelReason, performedBy: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: getLocalizedText("تم التحديث", "Updated", "Mis à jour") });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, performedBy: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: getLocalizedText("تم التحديث", "Updated", "Mis à jour") });
    },
  });

  const adjustPointsMutation = useMutation({
    mutationFn: async ({ id, pointsChange, note }: { id: string; pointsChange: number; note: string }) => {
      const res = await fetch(`/api/admin/users/${id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsChange, note, performedBy: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to adjust points");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: getLocalizedText("تم تعديل النقاط", "Points Adjusted", "Points Ajustés") });
    },
  });

  const updateLoyaltyConfigMutation = useMutation({
    mutationFn: async (data: Partial<LoyaltyConfig>) => {
      const res = await fetch("/api/admin/loyalty/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, performedBy: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to update config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/config"] });
      toast({ title: getLocalizedText("تم حفظ الإعدادات", "Settings Saved", "Paramètres Enregistrés") });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">
            {getLocalizedText("غير مصرح", "Unauthorized", "Non autorisé")}
          </h1>
          <p className="text-muted-foreground mb-4">
            {getLocalizedText(
              "ليس لديك صلاحية للوصول إلى هذه الصفحة",
              "You don't have permission to access this page",
              "Vous n'avez pas l'autorisation d'accéder à cette page"
            )}
          </p>
          <Button onClick={() => setLocation("/")} data-testid="go-home">
            {t("nav.home")}
          </Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: t("admin.dashboard") },
    { id: "packages", icon: Package, label: t("admin.packages") },
    { id: "orders", icon: ShoppingBag, label: t("admin.orders") },
    { id: "customers", icon: Users, label: t("admin.customers") },
    { id: "loyalty", icon: Gift, label: t("admin.loyalty") },
    { id: "content", icon: FileText, label: t("admin.content") },
    { id: "analytics", icon: BarChart3, label: t("admin.analytics") },
    ...(isSuperAdmin ? [
      { id: "admins", icon: Shield, label: t("admin.admins") },
      { id: "audit", icon: Settings, label: t("admin.auditLogs") },
    ] : []),
  ];

  const stats = [
    { label: t("admin.totalIncome"), value: `${analytics?.totalIncome?.toFixed(3) || "0"} KD`, icon: TrendingUp },
    { label: t("admin.totalOrders"), value: analytics?.totalOrders?.toString() || "0", icon: ShoppingBag },
    { label: t("admin.activeCustomers"), value: analytics?.newCustomers?.toString() || "0", icon: Users },
    { label: t("admin.pointsIssued"), value: analytics?.pointsIssued?.toString() || "0", icon: Gift },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      in_progress: "bg-primary/10 text-primary",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>{status}</span>;
  };

  return (
    <div className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t("admin.dashboard")}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={section === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setLocation(item.id === "dashboard" ? "/admin" : `/admin/${item.id}`)}
                      data-testid={`admin-nav-${item.id}`}
                    >
                      <item.icon className="h-4 w-4 me-2" />
                      {item.label}
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {section === "dashboard" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <Card key={index} data-testid={`stat-card-${index}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <stat.icon className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recent Orders Preview */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle>{getLocalizedText("أحدث الطلبات", "Recent Orders", "Commandes Récentes")}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/orders")}>
                      {getLocalizedText("عرض الكل", "View All", "Voir Tout")}
                      <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                      </div>
                    ) : orders?.length ? (
                      <div className="space-y-2">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              {getStatusBadge(order.status)}
                              <span className="text-sm font-medium">{order.area}</span>
                            </div>
                            <span className="font-bold text-primary">{order.priceKD} KD</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t("common.noData")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "packages" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h1 className="text-2xl font-bold">{t("admin.packages")}</h1>
                  <Button data-testid="add-package">
                    <Plus className="h-4 w-4 me-2" />
                    {getLocalizedText("إضافة باقة", "Add Package", "Ajouter un Forfait")}
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {packagesLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                    ) : packages?.length ? (
                      <div className="space-y-3">
                        {packages.map((pkg) => (
                          <div key={pkg.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`package-row-${pkg.id}`}>
                            <div>
                              <p className="font-medium">{getLocalizedText(pkg.nameAr, pkg.nameEn, pkg.nameFr)}</p>
                              <p className="text-sm text-muted-foreground">
                                Sedan: {pkg.priceSedanKD} KD | SUV: {pkg.priceSuvKD} KD
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={pkg.isActive ? "default" : "secondary"}>
                                {pkg.isActive ? getLocalizedText("نشط", "Active", "Actif") : getLocalizedText("غير نشط", "Inactive", "Inactif")}
                              </Badge>
                              <Button size="icon" variant="ghost">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t("common.noData")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "orders" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h1 className="text-2xl font-bold">{t("admin.orders")}</h1>
                  <Button variant="outline" onClick={() => window.open("/api/admin/export/orders", "_blank")}>
                    <Download className="h-4 w-4 me-2" />
                    {getLocalizedText("تصدير CSV", "Export CSV", "Exporter CSV")}
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {ordersLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                    ) : orders?.length ? (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4" data-testid={`order-row-${order.id}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(order.status)}
                                <span className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
                              </div>
                              <p className="font-medium">{order.area} - {order.address}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.preferredDate} {order.preferredTime}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-primary">{order.priceKD} KD</span>
                              <Select
                                value={order.status}
                                onValueChange={(status) => updateOrderMutation.mutate({ id: order.id, status })}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">{getLocalizedText("معلق", "Pending", "En Attente")}</SelectItem>
                                  <SelectItem value="assigned">{getLocalizedText("تم التعيين", "Assigned", "Assigné")}</SelectItem>
                                  <SelectItem value="in_progress">{getLocalizedText("قيد التنفيذ", "In Progress", "En Cours")}</SelectItem>
                                  <SelectItem value="completed">{getLocalizedText("مكتمل", "Completed", "Terminé")}</SelectItem>
                                  <SelectItem value="cancelled">{getLocalizedText("ملغي", "Cancelled", "Annulé")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t("common.noData")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "customers" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.customers")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    {customersLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                    ) : customers?.length ? (
                      <div className="space-y-3">
                        {customers.map((customer) => (
                          <div key={customer.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4" data-testid={`customer-row-${customer.id}`}>
                            <div className="flex-1">
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{customer.loyaltyPoints} pts</Badge>
                              <Badge variant={customer.status === "active" ? "default" : "destructive"}>
                                {customer.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant={customer.status === "active" ? "destructive" : "default"}
                                onClick={() => updateUserStatusMutation.mutate({
                                  id: customer.id,
                                  status: customer.status === "active" ? "blocked" : "active"
                                })}
                              >
                                {customer.status === "active" ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                              <PointsAdjustDialog
                                customerId={customer.id}
                                customerName={customer.name}
                                currentPoints={customer.loyaltyPoints}
                                onAdjust={(pointsChange, note) => adjustPointsMutation.mutate({ id: customer.id, pointsChange, note })}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t("common.noData")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "loyalty" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.loyalty")}</h1>
                {loyaltyConfig && (
                  <LoyaltyConfigEditor
                    config={loyaltyConfig}
                    onSave={(data) => updateLoyaltyConfigMutation.mutate(data)}
                    isPending={updateLoyaltyConfigMutation.isPending}
                    getLocalizedText={getLocalizedText}
                  />
                )}
              </div>
            )}

            {section === "content" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.content")}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="hover-elevate cursor-pointer" onClick={() => {}}>
                    <CardContent className="pt-6 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <p className="font-medium">{getLocalizedText("المدونة", "Blog Posts", "Articles de Blog")}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover-elevate cursor-pointer" onClick={() => {}}>
                    <CardContent className="pt-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-chart-1" />
                      <p className="font-medium">{getLocalizedText("الشهادات", "Testimonials", "Témoignages")}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover-elevate cursor-pointer" onClick={() => {}}>
                    <CardContent className="pt-6 text-center">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-chart-3" />
                      <p className="font-medium">{getLocalizedText("المعرض", "Gallery", "Galerie")}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {section === "analytics" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.analytics")}</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-primary">{analytics?.totalIncome?.toFixed(3) || "0"}</p>
                      <p className="text-sm text-muted-foreground">{getLocalizedText("إجمالي الدخل (د.ك)", "Total Income (KD)", "Revenu Total (KD)")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-green-600">{analytics?.completedOrders || 0}</p>
                      <p className="text-sm text-muted-foreground">{getLocalizedText("طلبات مكتملة", "Completed Orders", "Commandes Terminées")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-red-600">{analytics?.cancelledOrders || 0}</p>
                      <p className="text-sm text-muted-foreground">{getLocalizedText("طلبات ملغية", "Cancelled Orders", "Commandes Annulées")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-chart-1">{analytics?.referralCount || 0}</p>
                      <p className="text-sm text-muted-foreground">{getLocalizedText("الإحالات", "Referrals", "Parrainages")}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {section === "admins" && isSuperAdmin && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.admins")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "إدارة حسابات المشرفين - قريباً",
                        "Manage admin accounts - Coming soon",
                        "Gérer les comptes administrateurs - Bientôt"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "audit" && isSuperAdmin && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.auditLogs")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    {auditLogsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                      </div>
                    ) : auditLogs?.length ? (
                      <div className="space-y-2">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="p-3 rounded-lg border text-sm" data-testid={`audit-log-${log.id}`}>
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{log.actionType}</Badge>
                              <span className="text-muted-foreground">
                                {new Date(log.performedAt).toLocaleString(i18n.language)}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              {log.targetCollection} / {log.targetId.slice(0, 8)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t("common.noData")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Points Adjustment Dialog
function PointsAdjustDialog({ 
  customerId, 
  customerName, 
  currentPoints, 
  onAdjust 
}: { 
  customerId: string; 
  customerName: string; 
  currentPoints: number; 
  onAdjust: (points: number, note: string) => void;
}) {
  const [points, setPoints] = useState(0);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (points !== 0) {
      onAdjust(points, note);
      setOpen(false);
      setPoints(0);
      setNote("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Gift className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Points: {customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Current Points: {currentPoints}</p>
          <div className="space-y-2">
            <Label>Points Change (+ or -)</Label>
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              placeholder="e.g., 100 or -50"
            />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for adjustment"
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            <Save className="h-4 w-4 me-2" />
            Save Adjustment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Loyalty Config Editor
function LoyaltyConfigEditor({
  config,
  onSave,
  isPending,
  getLocalizedText,
}: {
  config: LoyaltyConfig;
  onSave: (data: Partial<LoyaltyConfig>) => void;
  isPending: boolean;
  getLocalizedText: (ar: string, en: string, fr: string) => string;
}) {
  const [formData, setFormData] = useState({
    pointsPerKD: config.pointsPerKD,
    conversionRate: config.conversionRate,
    maxRedeemPercentage: config.maxRedeemPercentage * 100,
    welcomeBonusPoints: config.welcomeBonusPoints,
    referrerBonusPoints: config.referrerBonusPoints,
    referredWelcomePoints: config.referredWelcomePoints,
    firstOrderDiscount: config.firstOrderDiscount * 100,
  });

  const handleSave = () => {
    onSave({
      pointsPerKD: formData.pointsPerKD,
      conversionRate: formData.conversionRate,
      maxRedeemPercentage: formData.maxRedeemPercentage / 100,
      welcomeBonusPoints: formData.welcomeBonusPoints,
      referrerBonusPoints: formData.referrerBonusPoints,
      referredWelcomePoints: formData.referredWelcomePoints,
      firstOrderDiscount: formData.firstOrderDiscount / 100,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getLocalizedText("إعدادات برنامج الولاء", "Loyalty Program Settings", "Paramètres du Programme de Fidélité")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{getLocalizedText("نقاط لكل دينار", "Points per KD", "Points par KD")}</Label>
            <Input
              type="number"
              value={formData.pointsPerKD}
              onChange={(e) => setFormData({ ...formData, pointsPerKD: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>{getLocalizedText("معدل التحويل (دينار/نقطة)", "Conversion Rate (KD/point)", "Taux de Conversion (KD/point)")}</Label>
            <Input
              type="number"
              step="0.001"
              value={formData.conversionRate}
              onChange={(e) => setFormData({ ...formData, conversionRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>{getLocalizedText("الحد الأقصى للاستخدام (%)", "Max Redeem (%)", "Max Utilisation (%)")}</Label>
            <Input
              type="number"
              value={formData.maxRedeemPercentage}
              onChange={(e) => setFormData({ ...formData, maxRedeemPercentage: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>{getLocalizedText("نقاط الترحيب", "Welcome Bonus", "Bonus de Bienvenue")}</Label>
            <Input
              type="number"
              value={formData.welcomeBonusPoints}
              onChange={(e) => setFormData({ ...formData, welcomeBonusPoints: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>{getLocalizedText("مكافأة المُحيل", "Referrer Bonus", "Bonus Parrain")}</Label>
            <Input
              type="number"
              value={formData.referrerBonusPoints}
              onChange={(e) => setFormData({ ...formData, referrerBonusPoints: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>{getLocalizedText("مكافأة المُحال", "Referred Bonus", "Bonus Filleul")}</Label>
            <Input
              type="number"
              value={formData.referredWelcomePoints}
              onChange={(e) => setFormData({ ...formData, referredWelcomePoints: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4 me-2" />
          {isPending ? getLocalizedText("جاري الحفظ...", "Saving...", "Enregistrement...") : getLocalizedText("حفظ الإعدادات", "Save Settings", "Enregistrer")}
        </Button>
      </CardContent>
    </Card>
  );
}
