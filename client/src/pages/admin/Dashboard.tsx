import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Gift, FileText, 
  BarChart3, Shield, Settings, ChevronRight, TrendingUp, Pencil, Trash2,
  Plus, Ban, CheckCircle, Download, Eye, X, Save, Camera, ImageIcon,
  Upload, Loader2, Calendar, MapPin, ChevronLeft
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
import type { ServicePackage, Order, User, LoyaltyConfig, AuditLog, Offer } from "@shared/schema";
import { Tag } from "lucide-react";
import type * as L from "leaflet";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/:section");
  const { user, firebaseUser, isAdmin, isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  
  const section = params?.section || "dashboard";

  // Date filter state - default to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  // Filter mode: daily, weekly, monthly, all
  const [filterMode, setFilterMode] = useState<"daily" | "weekly" | "monthly" | "all">("daily");

  // Package editing state
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [packageForm, setPackageForm] = useState({
    nameAr: "",
    nameEn: "",
    nameFr: "",
    descriptionAr: "",
    descriptionEn: "",
    descriptionFr: "",
    priceSedanKD: 0,
    priceSuvKD: 0,
    estimatedMinutes: 30,
    category: "exterior" as string,
    isActive: true,
  });

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

  const { data: allOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: isAdmin && (section === "orders" || section === "dashboard"),
  });

  // Filter orders based on filter mode (client-side filtering for fast UX)
  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    if (filterMode === "all") return allOrders;
    
    const selectedDateObj = new Date(selectedDate);
    
    if (filterMode === "daily") {
      return allOrders.filter(order => order.preferredDate === selectedDate);
    }
    
    if (filterMode === "weekly") {
      // Get start of week (Sunday)
      const startOfWeek = new Date(selectedDateObj);
      startOfWeek.setDate(selectedDateObj.getDate() - selectedDateObj.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      // Get end of week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return allOrders.filter(order => {
        const orderDate = new Date(order.preferredDate);
        return orderDate >= startOfWeek && orderDate <= endOfWeek;
      });
    }
    
    if (filterMode === "monthly") {
      const year = selectedDateObj.getFullYear();
      const month = selectedDateObj.getMonth();
      return allOrders.filter(order => {
        const orderDate = new Date(order.preferredDate);
        return orderDate.getFullYear() === year && orderDate.getMonth() === month;
      });
    }
    
    return allOrders;
  }, [allOrders, filterMode, selectedDate]);
  
  // Dashboard shows all recent orders, Orders page shows filtered by date
  const orders = section === "orders" ? filteredOrders : allOrders?.slice(0, 10);

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

  const { data: allOffers, isLoading: offersLoading } = useQuery<Offer[]>({
    queryKey: ["/api/admin/offers"],
    enabled: isAdmin && section === "offers",
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

  const createPackageMutation = useMutation({
    mutationFn: async (data: typeof packageForm) => {
      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, performedBy: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to create package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      setIsAddingPackage(false);
      resetPackageForm();
      toast({ title: getLocalizedText("تمت الإضافة بنجاح", "Package Added", "Forfait Ajouté") });
    },
    onError: () => {
      toast({ title: getLocalizedText("فشل في الإضافة", "Failed to add", "Échec de l'ajout"), variant: "destructive" });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof packageForm }) => {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, performedBy: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to update package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      setEditingPackage(null);
      resetPackageForm();
      toast({ title: getLocalizedText("تم التحديث بنجاح", "Package Updated", "Forfait Mis à Jour") });
    },
    onError: () => {
      toast({ title: getLocalizedText("فشل في التحديث", "Failed to update", "Échec de la mise à jour"), variant: "destructive" });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/packages/${id}?performedBy=${user?.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({ title: getLocalizedText("تم الحذف", "Package Deleted", "Forfait Supprimé") });
    },
    onError: () => {
      toast({ title: getLocalizedText("فشل في الحذف", "Failed to delete", "Échec de la suppression"), variant: "destructive" });
    },
  });

  const resetPackageForm = () => {
    setPackageForm({
      nameAr: "",
      nameEn: "",
      nameFr: "",
      descriptionAr: "",
      descriptionEn: "",
      descriptionFr: "",
      priceSedanKD: 0,
      priceSuvKD: 0,
      estimatedMinutes: 30,
      category: "exterior",
      isActive: true,
    });
  };

  const openEditPackage = (pkg: ServicePackage) => {
    setPackageForm({
      nameAr: pkg.nameAr,
      nameEn: pkg.nameEn,
      nameFr: pkg.nameFr,
      descriptionAr: pkg.descriptionAr || "",
      descriptionEn: pkg.descriptionEn || "",
      descriptionFr: pkg.descriptionFr || "",
      priceSedanKD: pkg.priceSedanKD,
      priceSuvKD: pkg.priceSuvKD,
      estimatedMinutes: pkg.estimatedMinutes,
      category: pkg.category,
      isActive: pkg.isActive,
    });
    setEditingPackage(pkg);
  };

  const openAddPackage = () => {
    resetPackageForm();
    setIsAddingPackage(true);
  };

  const handlePackageSubmit = () => {
    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, data: packageForm });
    } else {
      createPackageMutation.mutate(packageForm);
    }
  };

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
    { id: "offers", icon: Tag, label: getLocalizedText("العروض", "Offers", "Offres") },
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
                  <Button onClick={openAddPackage} data-testid="add-package">
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
                              <Button size="icon" variant="ghost" onClick={() => openEditPackage(pkg)} data-testid={`edit-package-${pkg.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deletePackageMutation.mutate(pkg.id)} data-testid={`delete-package-${pkg.id}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
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

                {/* Package Edit/Add Dialog */}
                <Dialog open={!!editingPackage || isAddingPackage} onOpenChange={(open) => {
                  if (!open) {
                    setEditingPackage(null);
                    setIsAddingPackage(false);
                    resetPackageForm();
                  }
                }}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPackage 
                          ? getLocalizedText("تعديل الباقة", "Edit Package", "Modifier le Forfait")
                          : getLocalizedText("إضافة باقة جديدة", "Add New Package", "Ajouter un Nouveau Forfait")
                        }
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{getLocalizedText("الاسم (عربي)", "Name (Arabic)", "Nom (Arabe)")}</Label>
                          <Input
                            value={packageForm.nameAr}
                            onChange={(e) => setPackageForm({ ...packageForm, nameAr: e.target.value })}
                            placeholder="غسيل خارجي"
                            dir="rtl"
                            data-testid="input-package-name-ar"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{getLocalizedText("الاسم (إنجليزي)", "Name (English)", "Nom (Anglais)")}</Label>
                          <Input
                            value={packageForm.nameEn}
                            onChange={(e) => setPackageForm({ ...packageForm, nameEn: e.target.value })}
                            placeholder="Exterior Wash"
                            data-testid="input-package-name-en"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{getLocalizedText("الاسم (فرنسي)", "Name (French)", "Nom (Français)")}</Label>
                          <Input
                            value={packageForm.nameFr}
                            onChange={(e) => setPackageForm({ ...packageForm, nameFr: e.target.value })}
                            placeholder="Lavage Extérieur"
                            data-testid="input-package-name-fr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{getLocalizedText("الوصف (عربي)", "Description (Arabic)", "Description (Arabe)")}</Label>
                          <Input
                            value={packageForm.descriptionAr}
                            onChange={(e) => setPackageForm({ ...packageForm, descriptionAr: e.target.value })}
                            dir="rtl"
                            data-testid="input-package-desc-ar"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{getLocalizedText("الوصف (إنجليزي)", "Description (English)", "Description (Anglais)")}</Label>
                          <Input
                            value={packageForm.descriptionEn}
                            onChange={(e) => setPackageForm({ ...packageForm, descriptionEn: e.target.value })}
                            data-testid="input-package-desc-en"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{getLocalizedText("الوصف (فرنسي)", "Description (French)", "Description (Français)")}</Label>
                          <Input
                            value={packageForm.descriptionFr}
                            onChange={(e) => setPackageForm({ ...packageForm, descriptionFr: e.target.value })}
                            data-testid="input-package-desc-fr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>{getLocalizedText("سعر سيدان (د.ك)", "Sedan Price (KD)", "Prix Berline (KD)")}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={packageForm.priceSedanKD}
                            onChange={(e) => setPackageForm({ ...packageForm, priceSedanKD: parseFloat(e.target.value) || 0 })}
                            data-testid="input-package-price-sedan"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{getLocalizedText("سعر SUV (د.ك)", "SUV Price (KD)", "Prix SUV (KD)")}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={packageForm.priceSuvKD}
                            onChange={(e) => setPackageForm({ ...packageForm, priceSuvKD: parseFloat(e.target.value) || 0 })}
                            data-testid="input-package-price-suv"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{getLocalizedText("المدة (دقائق)", "Duration (min)", "Durée (min)")}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={packageForm.estimatedMinutes}
                            onChange={(e) => setPackageForm({ ...packageForm, estimatedMinutes: parseInt(e.target.value) || 30 })}
                            data-testid="input-package-duration"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{getLocalizedText("الفئة", "Category", "Catégorie")}</Label>
                          <Select value={packageForm.category} onValueChange={(val) => setPackageForm({ ...packageForm, category: val })}>
                            <SelectTrigger data-testid="select-package-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="exterior">{getLocalizedText("خارجي", "Exterior", "Extérieur")}</SelectItem>
                              <SelectItem value="interior">{getLocalizedText("داخلي", "Interior", "Intérieur")}</SelectItem>
                              <SelectItem value="full">{getLocalizedText("كامل", "Full", "Complet")}</SelectItem>
                              <SelectItem value="vip">{getLocalizedText("VIP", "VIP", "VIP")}</SelectItem>
                              <SelectItem value="monthly">{getLocalizedText("شهري", "Monthly", "Mensuel")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label>{getLocalizedText("نشط", "Active", "Actif")}</Label>
                        <input
                          type="checkbox"
                          checked={packageForm.isActive}
                          onChange={(e) => setPackageForm({ ...packageForm, isActive: e.target.checked })}
                          className="h-4 w-4"
                          data-testid="checkbox-package-active"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handlePackageSubmit} 
                          disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                          data-testid="button-save-package"
                        >
                          <Save className="h-4 w-4 me-2" />
                          {(createPackageMutation.isPending || updatePackageMutation.isPending)
                            ? getLocalizedText("جاري الحفظ...", "Saving...", "Enregistrement...")
                            : getLocalizedText("حفظ", "Save", "Enregistrer")
                          }
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingPackage(null);
                            setIsAddingPackage(false);
                            resetPackageForm();
                          }}
                          data-testid="button-cancel-package"
                        >
                          <X className="h-4 w-4 me-2" />
                          {getLocalizedText("إلغاء", "Cancel", "Annuler")}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {section === "orders" && (
              <div className="space-y-6">
                {/* Header with Date Filter */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">{t("admin.orders")}</h1>
                    <Button variant="outline" onClick={() => window.open("/api/admin/export/orders", "_blank")}>
                      <Download className="h-4 w-4 me-2" />
                      {getLocalizedText("تصدير CSV", "Export CSV", "Exporter CSV")}
                    </Button>
                  </div>
                  
                  {/* Filter Mode Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-muted/50 rounded-lg p-1 gap-1">
                      <Button 
                        variant={filterMode === "daily" ? "default" : "ghost"} 
                        size="sm"
                        onClick={() => setFilterMode("daily")}
                        data-testid="button-filter-daily"
                      >
                        {getLocalizedText("يومي", "Daily", "Quotidien")}
                      </Button>
                      <Button 
                        variant={filterMode === "weekly" ? "default" : "ghost"} 
                        size="sm"
                        onClick={() => setFilterMode("weekly")}
                        data-testid="button-filter-weekly"
                      >
                        {getLocalizedText("أسبوعي", "Weekly", "Hebdomadaire")}
                      </Button>
                      <Button 
                        variant={filterMode === "monthly" ? "default" : "ghost"} 
                        size="sm"
                        onClick={() => setFilterMode("monthly")}
                        data-testid="button-filter-monthly"
                      >
                        {getLocalizedText("شهري", "Monthly", "Mensuel")}
                      </Button>
                      <Button 
                        variant={filterMode === "all" ? "default" : "ghost"} 
                        size="sm"
                        onClick={() => setFilterMode("all")}
                        data-testid="button-filter-all"
                      >
                        {getLocalizedText("الكل", "All", "Tout")}
                      </Button>
                    </div>
                    
                    {/* Date Navigator - hidden when "all" is selected */}
                    {filterMode !== "all" && (
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const d = new Date(selectedDate);
                            if (filterMode === "daily") d.setDate(d.getDate() - 1);
                            else if (filterMode === "weekly") d.setDate(d.getDate() - 7);
                            else if (filterMode === "monthly") d.setMonth(d.getMonth() - 1);
                            setSelectedDate(d.toISOString().split("T")[0]);
                          }}
                          data-testid="button-prev-period"
                        >
                          {i18n.language === "ar" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {filterMode === "monthly" ? (
                            <Input
                              type="month"
                              value={selectedDate.slice(0, 7)}
                              onChange={(e) => setSelectedDate(e.target.value + "-01")}
                              className="w-auto min-w-[140px]"
                              data-testid="input-month-filter"
                            />
                          ) : (
                            <Input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="w-auto min-w-[140px]"
                              data-testid="input-date-filter"
                            />
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const d = new Date(selectedDate);
                            if (filterMode === "daily") d.setDate(d.getDate() + 1);
                            else if (filterMode === "weekly") d.setDate(d.getDate() + 7);
                            else if (filterMode === "monthly") d.setMonth(d.getMonth() + 1);
                            setSelectedDate(d.toISOString().split("T")[0]);
                          }}
                          data-testid="button-next-period"
                        >
                          {i18n.language === "ar" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                          data-testid="button-today"
                        >
                          {getLocalizedText("اليوم", "Today", "Aujourd'hui")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Stats for Selected Date */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl font-bold">{filteredOrders.length}</div>
                      <p className="text-sm text-muted-foreground">{getLocalizedText("إجمالي الطلبات", "Total Orders", "Total Commandes")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl font-bold text-yellow-600">{filteredOrders.filter(o => o.status === "pending").length}</div>
                      <p className="text-sm text-muted-foreground">{getLocalizedText("قيد الانتظار", "Pending", "En Attente")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl font-bold text-blue-600">{filteredOrders.filter(o => ["assigned", "on_the_way", "in_progress"].includes(o.status)).length}</div>
                      <p className="text-sm text-muted-foreground">{getLocalizedText("قيد التنفيذ", "In Progress", "En Cours")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl font-bold text-green-600">{filteredOrders.filter(o => o.status === "completed").length}</div>
                      <p className="text-sm text-muted-foreground">{getLocalizedText("مكتمل", "Completed", "Terminé")}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Map showing order locations */}
                {filteredOrders.some(o => o.latitude && o.longitude) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {getLocalizedText("خريطة الطلبات", "Orders Map", "Carte des Commandes")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminOrdersMap orders={filteredOrders} getLocalizedText={getLocalizedText} getStatusBadge={getStatusBadge} />
                    </CardContent>
                  </Card>
                )}

                {/* Orders List */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {filterMode === "all" ? (
                        getLocalizedText("جميع الطلبات", "All Orders", "Toutes les Commandes")
                      ) : filterMode === "monthly" ? (
                        getLocalizedText(
                          `طلبات ${new Date(selectedDate).toLocaleDateString("ar-KW", { month: "long", year: "numeric" })}`,
                          `Orders for ${new Date(selectedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
                          `Commandes de ${new Date(selectedDate).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`
                        )
                      ) : filterMode === "weekly" ? (
                        (() => {
                          const d = new Date(selectedDate);
                          const startOfWeek = new Date(d);
                          startOfWeek.setDate(d.getDate() - d.getDay());
                          const endOfWeek = new Date(startOfWeek);
                          endOfWeek.setDate(startOfWeek.getDate() + 6);
                          return getLocalizedText(
                            `طلبات الأسبوع (${startOfWeek.toLocaleDateString("ar-KW", { day: "numeric", month: "short" })} - ${endOfWeek.toLocaleDateString("ar-KW", { day: "numeric", month: "short" })})`,
                            `Orders for Week (${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
                            `Commandes de la Semaine (${startOfWeek.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${endOfWeek.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })})`
                          );
                        })()
                      ) : (
                        getLocalizedText(
                          `طلبات ${new Date(selectedDate).toLocaleDateString("ar-KW", { weekday: "long", day: "numeric", month: "long" })}`,
                          `Orders for ${new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
                          `Commandes du ${new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`
                        )
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                    ) : filteredOrders.length ? (
                      <div className="space-y-3">
                        {filteredOrders.map((order) => (
                          <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4" data-testid={`order-row-${order.id}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {getStatusBadge(order.status)}
                                <span className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
                                {order.status !== "pending" && (
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                                    {getLocalizedText("تم التعيين", "Assigned", "Assigné")}
                                  </Badge>
                                )}
                                {(order.beforePhotoUrl || order.afterPhotoUrl) && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Camera className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                                    {getLocalizedText("صور", "Photos", "Photos")}
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium">{order.area} - {order.address}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.preferredTime} | {order.carType}
                              </p>
                              {(order.beforePhotoUrl || order.afterPhotoUrl) && (
                                <div className="flex gap-4 mt-2">
                                  {order.beforePhotoUrl && (
                                    <a href={order.beforePhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3" />
                                      {getLocalizedText("قبل", "Before", "Avant")}
                                    </a>
                                  )}
                                  {order.afterPhotoUrl && (
                                    <a href={order.afterPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3" />
                                      {getLocalizedText("بعد", "After", "Après")}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              {order.latitude && order.longitude && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`, "_blank")}
                                  data-testid={`button-map-${order.id}`}
                                >
                                  <MapPin className="h-4 w-4" />
                                </Button>
                              )}
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
                                  <SelectItem value="on_the_way">{getLocalizedText("في الطريق", "On The Way", "En Route")}</SelectItem>
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
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {getLocalizedText(
                            "لا توجد طلبات في هذا اليوم",
                            "No orders for this date",
                            "Aucune commande pour cette date"
                          )}
                        </p>
                      </div>
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
                  <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/blog")} data-testid="card-blog">
                    <CardContent className="pt-6 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <p className="font-medium">{getLocalizedText("المدونة", "Blog Posts", "Articles de Blog")}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/testimonials")} data-testid="card-testimonials">
                    <CardContent className="pt-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-chart-1" />
                      <p className="font-medium">{getLocalizedText("الشهادات", "Testimonials", "Témoignages")}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/gallery")} data-testid="card-gallery">
                    <CardContent className="pt-6 text-center">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-chart-3" />
                      <p className="font-medium">{getLocalizedText("المعرض", "Gallery", "Galerie")}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {section === "blog" && (
              <ContentBlogManager getLocalizedText={getLocalizedText} firebaseUser={firebaseUser} />
            )}

            {section === "testimonials" && (
              <ContentTestimonialsManager getLocalizedText={getLocalizedText} firebaseUser={firebaseUser} />
            )}

            {section === "gallery" && (
              <ContentGalleryManager getLocalizedText={getLocalizedText} firebaseUser={firebaseUser} />
            )}

            {section === "offers" && (
              <OffersManager 
                offers={allOffers || []} 
                isLoading={offersLoading}
                getLocalizedText={getLocalizedText} 
                firebaseUser={firebaseUser} 
              />
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
              <AdminManagement 
                userId={user?.id || ""} 
                firebaseUser={firebaseUser}
                getLocalizedText={getLocalizedText} 
              />
            )}

            {section === "audit" && isSuperAdmin && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h1 className="text-2xl font-bold">{t("admin.auditLogs")}</h1>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (confirm(getLocalizedText(
                          "هل تريد حذف السجلات الأقدم من 30 يوم؟",
                          "Delete logs older than 30 days?",
                          "Supprimer les logs de plus de 30 jours?"
                        ))) {
                          try {
                            const res = await fetch("/api/admin/audit-logs?olderThanDays=30", {
                              method: "DELETE",
                              headers: { "Authorization": `Bearer ${await firebaseUser?.getIdToken()}` },
                            });
                            const data = await res.json();
                            if (res.ok) {
                              toast({ title: getLocalizedText(`تم حذف ${data.deletedCount} سجل`, `Deleted ${data.deletedCount} logs`, `${data.deletedCount} logs supprimés`) });
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
                            }
                          } catch (e) {
                            toast({ title: getLocalizedText("خطأ", "Error", "Erreur"), variant: "destructive" });
                          }
                        }
                      }}
                      data-testid="clear-old-logs-btn"
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {getLocalizedText("حذف +30 يوم", "Clear 30+ days", "Suppr. +30 jours")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (confirm(getLocalizedText(
                          "هل أنت متأكد؟ سيتم حذف جميع سجلات العمليات!",
                          "Are you sure? This will delete ALL audit logs!",
                          "Êtes-vous sûr? Cela supprimera TOUS les logs!"
                        ))) {
                          try {
                            const res = await fetch("/api/admin/audit-logs?clearAll=true", {
                              method: "DELETE",
                              headers: { "Authorization": `Bearer ${await firebaseUser?.getIdToken()}` },
                            });
                            const data = await res.json();
                            if (res.ok) {
                              toast({ title: getLocalizedText(`تم حذف ${data.deletedCount} سجل`, `Deleted ${data.deletedCount} logs`, `${data.deletedCount} logs supprimés`) });
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
                            }
                          } catch (e) {
                            toast({ title: getLocalizedText("خطأ", "Error", "Erreur"), variant: "destructive" });
                          }
                        }
                      }}
                      data-testid="clear-all-logs-btn"
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {getLocalizedText("حذف الكل", "Clear All", "Supprimer tout")}
                    </Button>
                  </div>
                </div>
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

// Admin Management Component (Super Admin only)
function AdminManagement({
  userId,
  firebaseUser,
  getLocalizedText,
}: {
  userId: string;
  firebaseUser: any;
  getLocalizedText: (ar: string, en: string, fr: string) => string;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "delegate",
    password: "",
  });

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!firebaseUser) {
      throw new Error("Not authenticated");
    }
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const { data: admins, isLoading, error: adminsError } = useQuery<User[]>({
    queryKey: ["/api/admin/admins"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/admins", { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Authentication required. Please sign in again.");
        }
        throw new Error("Failed to fetch admins");
      }
      return res.json();
    },
    enabled: !!firebaseUser,
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create admin");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: getLocalizedText("تم إنشاء المشرف", "Admin created", "Administrateur créé") });
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update admin");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: getLocalizedText("تم تحديث المشرف", "Admin updated", "Administrateur mis à jour") });
      setEditingAdmin(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to deactivate admin");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: getLocalizedText("تم إلغاء تفعيل المشرف", "Admin deactivated", "Administrateur désactivé") });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", role: "admin", password: "" });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({ title: getLocalizedText("الاسم والإيميل مطلوبان", "Name and email are required", "Nom et email requis"), variant: "destructive" });
      return;
    }
    createAdminMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingAdmin) return;
    updateAdminMutation.mutate({
      id: editingAdmin.id,
      data: {
        name: formData.name,
        phone: formData.phone,
        role: formData.role as "admin" | "super_admin" | "customer",
        status: editingAdmin.status,
      },
    });
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      delegate: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      customer: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    const labels: Record<string, string> = {
      super_admin: getLocalizedText("سوبر أدمن", "Super Admin", "Super Admin"),
      admin: getLocalizedText("مشرف", "Admin", "Admin"),
      delegate: getLocalizedText("مندوب", "Delegate", "Délégué"),
      customer: getLocalizedText("عميل", "Customer", "Client"),
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || colors.customer}`}>{labels[role] || role}</span>;
  };

  if (!firebaseUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("admin.admins")}</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {getLocalizedText("جارٍ التحميل...", "Loading...", "Chargement...")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("admin.admins")}</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">
              {getLocalizedText("فشل تحميل المشرفين", "Failed to load admins", "Échec du chargement")}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              {(adminsError as Error).message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t("admin.admins")}</h1>
        <Button onClick={() => { setShowAddForm(true); setEditingAdmin(null); resetForm(); }} data-testid="add-admin-btn">
          <Plus className="h-4 w-4 me-2" />
          {getLocalizedText("إضافة مشرف", "Add Admin", "Ajouter Admin")}
        </Button>
      </div>

      {(showAddForm || editingAdmin) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>
              {editingAdmin 
                ? getLocalizedText("تعديل المشرف", "Edit Admin", "Modifier Admin")
                : getLocalizedText("إضافة مشرف جديد", "Add New Admin", "Ajouter Nouvel Admin")
              }
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={() => { setShowAddForm(false); setEditingAdmin(null); resetForm(); }}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{getLocalizedText("الاسم الكامل", "Full Name", "Nom Complet")} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={getLocalizedText("أدخل الاسم", "Enter name", "Entrez le nom")}
                  data-testid="input-admin-name"
                />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("البريد الإلكتروني", "Email", "Email")} *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  disabled={!!editingAdmin}
                  data-testid="input-admin-email"
                />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("رقم الهاتف", "Phone", "Téléphone")}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+965 XXXX XXXX"
                  data-testid="input-admin-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("الدور", "Role", "Rôle")}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger data-testid="select-admin-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delegate">{getLocalizedText("مندوب", "Delegate", "Délégué")}</SelectItem>
                    <SelectItem value="admin">{getLocalizedText("مشرف", "Admin", "Admin")}</SelectItem>
                    <SelectItem value="super_admin">{getLocalizedText("سوبر أدمن", "Super Admin", "Super Admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingAdmin && (
                <div className="space-y-2 md:col-span-2">
                  <Label>{getLocalizedText("كلمة المرور الابتدائية", "Initial Password", "Mot de passe initial")}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={getLocalizedText("اتركه فارغاً لتوليد كلمة مرور تلقائية", "Leave empty for auto-generated password", "Laisser vide pour mot de passe auto-généré")}
                    data-testid="input-admin-password"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={editingAdmin ? handleUpdate : handleSubmit} 
                disabled={createAdminMutation.isPending || updateAdminMutation.isPending}
                data-testid="btn-save-admin"
              >
                <Save className="h-4 w-4 me-2" />
                {(createAdminMutation.isPending || updateAdminMutation.isPending) 
                  ? getLocalizedText("جاري الحفظ...", "Saving...", "Enregistrement...")
                  : getLocalizedText("حفظ", "Save", "Enregistrer")
                }
              </Button>
              <Button variant="outline" onClick={() => { setShowAddForm(false); setEditingAdmin(null); resetForm(); }}>
                {getLocalizedText("إلغاء", "Cancel", "Annuler")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{getLocalizedText("قائمة المشرفين", "Admins List", "Liste des Administrateurs")}</CardTitle>
          <CardDescription>
            {getLocalizedText(
              "إدارة جميع حسابات المشرفين في النظام",
              "Manage all admin accounts in the system",
              "Gérer tous les comptes administrateurs"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : admins?.length ? (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div 
                  key={admin.id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4"
                  data-testid={`admin-row-${admin.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium">{admin.name}</span>
                      {getRoleBadge(admin.role)}
                      <Badge variant={admin.status === "active" ? "default" : "destructive"} className="text-xs">
                        {admin.status === "active" 
                          ? getLocalizedText("نشط", "Active", "Actif")
                          : getLocalizedText("محظور", "Blocked", "Bloqué")
                        }
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    {admin.phone && <p className="text-sm text-muted-foreground">{admin.phone}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {getLocalizedText("تاريخ الإنشاء:", "Created:", "Créé le:")} {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.id !== userId && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAdmin(admin);
                            setFormData({
                              name: admin.name,
                              email: admin.email,
                              phone: admin.phone || "",
                              role: admin.role,
                              password: "",
                            });
                            setShowAddForm(false);
                          }}
                          data-testid={`edit-admin-${admin.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={admin.status === "active" ? "destructive" : "default"}
                          onClick={() => {
                            if (admin.status === "active") {
                              if (confirm(getLocalizedText(
                                "هل أنت متأكد من إلغاء تفعيل هذا المشرف؟",
                                "Are you sure you want to deactivate this admin?",
                                "Êtes-vous sûr de vouloir désactiver cet administrateur?"
                              ))) {
                                deleteAdminMutation.mutate(admin.id);
                              }
                            } else {
                              updateAdminMutation.mutate({
                                id: admin.id,
                                data: { status: "active" },
                              });
                            }
                          }}
                          data-testid={`toggle-admin-${admin.id}`}
                        >
                          {admin.status === "active" ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                    {admin.id === userId && (
                      <Badge variant="outline">{getLocalizedText("أنت", "You", "Vous")}</Badge>
                    )}
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
  );
}

function ContentBlogManager({ getLocalizedText, firebaseUser }: { getLocalizedText: (ar: string, en: string, fr: string) => string; firebaseUser: any }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    titleAr: "", titleEn: "", titleFr: "",
    contentAr: "", contentEn: "", contentFr: "",
    imageUrl: "", isPublished: true
  });

  const getAuthHeaders = async () => {
    if (!firebaseUser) throw new Error("Not authenticated");
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const { data: posts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/blog"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/blog", { headers });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/blog", {
        method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] }); toast({ title: getLocalizedText("تم الإنشاء", "Created", "Créé") }); resetForm(); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof form> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] }); toast({ title: getLocalizedText("تم التحديث", "Updated", "Mis à jour") }); resetForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] }); toast({ title: getLocalizedText("تم الحذف", "Deleted", "Supprimé") }); }
  });

  const resetForm = () => {
    setForm({ titleAr: "", titleEn: "", titleFr: "", contentAr: "", contentEn: "", contentFr: "", imageUrl: "", isPublished: true });
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{getLocalizedText("إدارة المدونة", "Blog Management", "Gestion du Blog")}</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} data-testid="button-add-blog">
          <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {getLocalizedText("إضافة مقال", "Add Article", "Ajouter un article")}
        </Button>
      </div>

      {(showForm || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? getLocalizedText("تعديل المقال", "Edit Article", "Modifier l'article") : getLocalizedText("إضافة مقال جديد", "Add New Article", "Ajouter un nouvel article")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{getLocalizedText("العنوان (عربي)", "Title (Arabic)", "Titre (Arabe)")}</Label>
                <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} data-testid="input-blog-title-ar" />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("العنوان (إنجليزي)", "Title (English)", "Titre (Anglais)")}</Label>
                <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} data-testid="input-blog-title-en" />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("العنوان (فرنسي)", "Title (French)", "Titre (Français)")}</Label>
                <Input value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} data-testid="input-blog-title-fr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{getLocalizedText("المحتوى (عربي)", "Content (Arabic)", "Contenu (Arabe)")}</Label>
              <textarea className="w-full min-h-[100px] p-2 border rounded-md bg-background" value={form.contentAr} onChange={(e) => setForm({ ...form, contentAr: e.target.value })} data-testid="input-blog-content-ar" />
            </div>
            <div className="space-y-2">
              <Label>{getLocalizedText("المحتوى (إنجليزي)", "Content (English)", "Contenu (Anglais)")}</Label>
              <textarea className="w-full min-h-[100px] p-2 border rounded-md bg-background" value={form.contentEn} onChange={(e) => setForm({ ...form, contentEn: e.target.value })} data-testid="input-blog-content-en" />
            </div>
            <div className="space-y-2">
              <Label>{getLocalizedText("المحتوى (فرنسي)", "Content (French)", "Contenu (Français)")}</Label>
              <textarea className="w-full min-h-[100px] p-2 border rounded-md bg-background" value={form.contentFr} onChange={(e) => setForm({ ...form, contentFr: e.target.value })} data-testid="input-blog-content-fr" />
            </div>
            <div className="space-y-2">
              <Label>{getLocalizedText("رابط الصورة", "Image URL", "URL de l'image")}</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} data-testid="input-blog-image" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={() => editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form)} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-blog">
                <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {getLocalizedText("حفظ", "Save", "Enregistrer")}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-blog">
                <X className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {getLocalizedText("إلغاء", "Cancel", "Annuler")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Card key={post.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{getLocalizedText(post.titleAr, post.titleEn, post.titleFr)}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{getLocalizedText(post.contentAr, post.contentEn, post.contentFr)}</p>
                    <Badge variant={post.isPublished ? "default" : "secondary"} className="mt-2">
                      {post.isPublished ? getLocalizedText("منشور", "Published", "Publié") : getLocalizedText("مسودة", "Draft", "Brouillon")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => { setEditing(post); setForm({ titleAr: post.titleAr, titleEn: post.titleEn, titleFr: post.titleFr, contentAr: post.contentAr, contentEn: post.contentEn, contentFr: post.contentFr, imageUrl: post.imageUrl || "", isPublished: post.isPublished }); }} data-testid={`edit-blog-${post.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => { if (confirm(getLocalizedText("هل أنت متأكد؟", "Are you sure?", "Êtes-vous sûr?"))) deleteMutation.mutate(post.id); }} data-testid={`delete-blog-${post.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">{t("common.noData")}</p>
      )}
    </div>
  );
}

function ContentTestimonialsManager({ getLocalizedText, firebaseUser }: { getLocalizedText: (ar: string, en: string, fr: string) => string; firebaseUser: any }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ customerName: "", contentAr: "", contentEn: "", contentFr: "", rating: 5, imageUrl: "", isApproved: true });

  const getAuthHeaders = async () => {
    if (!firebaseUser) throw new Error("Not authenticated");
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/testimonials"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/testimonials", { headers });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/testimonials", {
        method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] }); toast({ title: getLocalizedText("تم الإنشاء", "Created", "Créé") }); resetForm(); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof form> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] }); toast({ title: getLocalizedText("تم التحديث", "Updated", "Mis à jour") }); resetForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] }); toast({ title: getLocalizedText("تم الحذف", "Deleted", "Supprimé") }); }
  });

  const resetForm = () => { setForm({ customerName: "", contentAr: "", contentEn: "", contentFr: "", rating: 5, imageUrl: "", isApproved: true }); setEditing(null); setShowForm(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{getLocalizedText("إدارة الشهادات", "Testimonials Management", "Gestion des Témoignages")}</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} data-testid="button-add-testimonial">
          <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {getLocalizedText("إضافة شهادة", "Add Testimonial", "Ajouter un témoignage")}
        </Button>
      </div>

      {(showForm || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? getLocalizedText("تعديل الشهادة", "Edit Testimonial", "Modifier le témoignage") : getLocalizedText("إضافة شهادة جديدة", "Add New Testimonial", "Ajouter un nouveau témoignage")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{getLocalizedText("اسم العميل", "Customer Name", "Nom du client")}</Label>
                <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} data-testid="input-testimonial-name" />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("التقييم", "Rating", "Note")}</Label>
                <Select value={String(form.rating)} onValueChange={(v) => setForm({ ...form, rating: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5,4,3,2,1].map(n => <SelectItem key={n} value={String(n)}>{n} / 5</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{getLocalizedText("المحتوى (عربي)", "Content (Arabic)", "Contenu (Arabe)")}</Label>
              <textarea className="w-full min-h-[80px] p-2 border rounded-md bg-background" value={form.contentAr} onChange={(e) => setForm({ ...form, contentAr: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{getLocalizedText("المحتوى (إنجليزي)", "Content (English)", "Contenu (Anglais)")}</Label>
              <textarea className="w-full min-h-[80px] p-2 border rounded-md bg-background" value={form.contentEn} onChange={(e) => setForm({ ...form, contentEn: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{getLocalizedText("المحتوى (فرنسي)", "Content (French)", "Contenu (Français)")}</Label>
              <textarea className="w-full min-h-[80px] p-2 border rounded-md bg-background" value={form.contentFr} onChange={(e) => setForm({ ...form, contentFr: e.target.value })} />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={() => editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form)} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-testimonial">
                <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {getLocalizedText("حفظ", "Save", "Enregistrer")}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-testimonial">
                <X className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {getLocalizedText("إلغاء", "Cancel", "Annuler")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : items && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{item.customerName}</h3>
                    <p className="text-sm text-muted-foreground">{getLocalizedText(item.contentAr, item.contentEn, item.contentFr)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={item.isApproved ? "default" : "secondary"}>{item.isApproved ? getLocalizedText("معتمد", "Approved", "Approuvé") : getLocalizedText("قيد المراجعة", "Pending", "En attente")}</Badge>
                      <Badge variant="outline">{item.rating}/5</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => { setEditing(item); setForm({ customerName: item.customerName, contentAr: item.contentAr, contentEn: item.contentEn, contentFr: item.contentFr, rating: item.rating, imageUrl: item.imageUrl || "", isApproved: item.isApproved }); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => { if (confirm(getLocalizedText("هل أنت متأكد؟", "Are you sure?", "Êtes-vous sûr?"))) deleteMutation.mutate(item.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">{t("common.noData")}</p>
      )}
    </div>
  );
}

function ContentGalleryManager({ getLocalizedText, firebaseUser }: { getLocalizedText: (ar: string, en: string, fr: string) => string; firebaseUser: any }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ beforeImageUrl: "", afterImageUrl: "", captionAr: "", captionEn: "", captionFr: "", isPublished: true });

  const getAuthHeaders = async () => {
    if (!firebaseUser) throw new Error("Not authenticated");
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/gallery"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/gallery", { headers });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/gallery", {
        method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] }); toast({ title: getLocalizedText("تم الإنشاء", "Created", "Créé") }); resetForm(); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof form> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] }); toast({ title: getLocalizedText("تم التحديث", "Updated", "Mis à jour") }); resetForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] }); toast({ title: getLocalizedText("تم الحذف", "Deleted", "Supprimé") }); }
  });

  const resetForm = () => { setForm({ beforeImageUrl: "", afterImageUrl: "", captionAr: "", captionEn: "", captionFr: "", isPublished: true }); setEditing(null); setShowForm(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{getLocalizedText("إدارة المعرض", "Gallery Management", "Gestion de la Galerie")}</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} data-testid="button-add-gallery">
          <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {getLocalizedText("إضافة صورة", "Add Image", "Ajouter une image")}
        </Button>
      </div>

      {(showForm || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? getLocalizedText("تعديل الصورة", "Edit Image", "Modifier l'image") : getLocalizedText("إضافة صورة جديدة", "Add New Image", "Ajouter une nouvelle image")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{getLocalizedText("صورة قبل", "Before Image URL", "URL image avant")}</Label>
                <Input value={form.beforeImageUrl} onChange={(e) => setForm({ ...form, beforeImageUrl: e.target.value })} data-testid="input-gallery-before" />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("صورة بعد", "After Image URL", "URL image après")}</Label>
                <Input value={form.afterImageUrl} onChange={(e) => setForm({ ...form, afterImageUrl: e.target.value })} data-testid="input-gallery-after" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{getLocalizedText("الوصف (عربي)", "Caption (Arabic)", "Légende (Arabe)")}</Label>
                <Input value={form.captionAr} onChange={(e) => setForm({ ...form, captionAr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("الوصف (إنجليزي)", "Caption (English)", "Légende (Anglais)")}</Label>
                <Input value={form.captionEn} onChange={(e) => setForm({ ...form, captionEn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{getLocalizedText("الوصف (فرنسي)", "Caption (French)", "Légende (Français)")}</Label>
                <Input value={form.captionFr} onChange={(e) => setForm({ ...form, captionFr: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={() => editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form)} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-gallery">
                <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {getLocalizedText("حفظ", "Save", "Enregistrer")}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-gallery">
                <X className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {getLocalizedText("إلغاء", "Cancel", "Annuler")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}</div>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-1">
                  {item.beforeImageUrl && <img src={item.beforeImageUrl} alt="Before" className="w-full h-32 object-cover" />}
                  {item.afterImageUrl && <img src={item.afterImageUrl} alt="After" className="w-full h-32 object-cover" />}
                </div>
                <div className="p-4">
                  <p className="text-sm">{getLocalizedText(item.captionAr, item.captionEn, item.captionFr)}</p>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <Badge variant={item.isPublished ? "default" : "secondary"}>{item.isPublished ? getLocalizedText("منشور", "Published", "Publié") : getLocalizedText("مسودة", "Draft", "Brouillon")}</Badge>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" onClick={() => { setEditing(item); setForm({ beforeImageUrl: item.beforeImageUrl, afterImageUrl: item.afterImageUrl, captionAr: item.captionAr, captionEn: item.captionEn, captionFr: item.captionFr, isPublished: item.isPublished }); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => { if (confirm(getLocalizedText("هل أنت متأكد؟", "Are you sure?", "Êtes-vous sûr?"))) deleteMutation.mutate(item.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">{t("common.noData")}</p>
      )}
    </div>
  );
}

// Offers Manager Component
function OffersManager({ 
  offers, 
  isLoading, 
  getLocalizedText, 
  firebaseUser 
}: { 
  offers: Offer[];
  isLoading: boolean;
  getLocalizedText: (ar: string, en: string, fr: string) => string; 
  firebaseUser: any;
}) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Offer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    titleAr: "",
    titleEn: "",
    titleFr: "",
    descriptionAr: "",
    descriptionEn: "",
    descriptionFr: "",
    discountPercentage: "",
    discountAmountKD: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    isActive: true,
    targetAudience: "all" as "all" | "new_customers" | "existing_customers",
    loyaltyScope: "outside_loyalty" as "inside_loyalty" | "outside_loyalty",
  });

  const resetForm = () => {
    setForm({
      titleAr: "",
      titleEn: "",
      titleFr: "",
      descriptionAr: "",
      descriptionEn: "",
      descriptionFr: "",
      discountPercentage: "",
      discountAmountKD: "",
      imageUrl: "",
      startDate: "",
      endDate: "",
      isActive: true,
      targetAudience: "all",
      loyaltyScope: "outside_loyalty",
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: getLocalizedText("نوع الملف غير مدعوم", "File type not supported", "Type de fichier non pris en charge"), 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: getLocalizedText("الملف كبير جداً (الحد الأقصى 5MB)", "File too large (max 5MB)", "Fichier trop volumineux (max 5MB)"), 
        variant: "destructive" 
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch("/api/admin/offers/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      setForm({ ...form, imageUrl: data.imageUrl });
      toast({ title: getLocalizedText("تم رفع الصورة", "Image uploaded", "Image téléchargée") });
    } catch (error) {
      toast({ 
        title: getLocalizedText("فشل رفع الصورة", "Upload failed", "Échec du téléchargement"), 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : null,
          discountAmountKD: data.discountAmountKD ? parseFloat(data.discountAmountKD) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create offer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      toast({ title: getLocalizedText("تم إنشاء العرض", "Offer created", "Offre créée") });
      resetForm();
    },
    onError: () => {
      toast({ title: getLocalizedText("خطأ في الإنشاء", "Creation failed", "Échec de la création"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof form }) => {
      const res = await fetch(`/api/admin/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : null,
          discountAmountKD: data.discountAmountKD ? parseFloat(data.discountAmountKD) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update offer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      toast({ title: getLocalizedText("تم التحديث", "Updated", "Mis à jour") });
      resetForm();
    },
    onError: () => {
      toast({ title: getLocalizedText("خطأ في التحديث", "Update failed", "Échec de la mise à jour"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete offer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      toast({ title: getLocalizedText("تم الحذف", "Deleted", "Supprimé") });
    },
    onError: () => {
      toast({ title: getLocalizedText("خطأ في الحذف", "Delete failed", "Échec de la suppression"), variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update offer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      toast({ title: getLocalizedText("تم التحديث", "Updated", "Mis à jour") });
    },
  });

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const isOfferActive = (offer: Offer) => {
    if (!offer.isActive) return false;
    const now = new Date();
    return new Date(offer.startDate) <= now && new Date(offer.endDate) >= now;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{getLocalizedText("العروض", "Offers", "Offres")}</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} data-testid="button-add-offer">
          <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {getLocalizedText("إضافة عرض", "Add Offer", "Ajouter une offre")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? getLocalizedText("تعديل العرض", "Edit Offer", "Modifier l'offre") : getLocalizedText("إضافة عرض جديد", "Add New Offer", "Ajouter une nouvelle offre")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{getLocalizedText("العنوان (عربي)", "Title (Arabic)", "Titre (Arabe)")}</Label>
                <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} data-testid="input-offer-title-ar" />
              </div>
              <div>
                <Label>{getLocalizedText("العنوان (إنجليزي)", "Title (English)", "Titre (Anglais)")}</Label>
                <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} data-testid="input-offer-title-en" />
              </div>
              <div>
                <Label>{getLocalizedText("العنوان (فرنسي)", "Title (French)", "Titre (Français)")}</Label>
                <Input value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} data-testid="input-offer-title-fr" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{getLocalizedText("الوصف (عربي)", "Description (Arabic)", "Description (Arabe)")}</Label>
                <Input value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} data-testid="input-offer-desc-ar" />
              </div>
              <div>
                <Label>{getLocalizedText("الوصف (إنجليزي)", "Description (English)", "Description (Anglais)")}</Label>
                <Input value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} data-testid="input-offer-desc-en" />
              </div>
              <div>
                <Label>{getLocalizedText("الوصف (فرنسي)", "Description (French)", "Description (Français)")}</Label>
                <Input value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} data-testid="input-offer-desc-fr" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{getLocalizedText("نسبة الخصم (%)", "Discount Percentage (%)", "Pourcentage de réduction (%)")}</Label>
                <Input type="number" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} placeholder="0-100" data-testid="input-offer-discount-percent" />
              </div>
              <div>
                <Label>{getLocalizedText("مبلغ الخصم (د.ك)", "Discount Amount (KD)", "Montant de réduction (KD)")}</Label>
                <Input type="number" value={form.discountAmountKD} onChange={(e) => setForm({ ...form, discountAmountKD: e.target.value })} placeholder="0.000" step="0.001" data-testid="input-offer-discount-amount" />
              </div>
              <div>
                <Label>{getLocalizedText("الصورة", "Image", "Image")}</Label>
                <div className="flex gap-2">
                  <Input 
                    value={form.imageUrl} 
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} 
                    placeholder={getLocalizedText("رابط أو رفع صورة", "URL or upload image", "URL ou télécharger")} 
                    data-testid="input-offer-image" 
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    data-testid="input-offer-image-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    data-testid="button-upload-offer-image"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 relative w-20 h-20">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{getLocalizedText("تاريخ البدء", "Start Date", "Date de début")}</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} data-testid="input-offer-start-date" />
              </div>
              <div>
                <Label>{getLocalizedText("تاريخ الانتهاء", "End Date", "Date de fin")}</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} data-testid="input-offer-end-date" />
              </div>
              <div className="flex items-end">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
                    className="w-4 h-4"
                    data-testid="input-offer-active"
                  />
                  {getLocalizedText("نشط", "Active", "Actif")}
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{getLocalizedText("الجمهور المستهدف", "Target Audience", "Public cible")}</Label>
                <Select value={form.targetAudience} onValueChange={(v: "all" | "new_customers" | "existing_customers") => setForm({ ...form, targetAudience: v })}>
                  <SelectTrigger data-testid="select-offer-audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{getLocalizedText("الجميع", "All Customers", "Tous les clients")}</SelectItem>
                    <SelectItem value="new_customers">{getLocalizedText("العملاء الجدد", "New Customers", "Nouveaux clients")}</SelectItem>
                    <SelectItem value="existing_customers">{getLocalizedText("العملاء الحاليين", "Existing Customers", "Clients existants")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{getLocalizedText("نظام الولاء", "Loyalty System", "Système de fidélité")}</Label>
                <Select value={form.loyaltyScope} onValueChange={(v: "inside_loyalty" | "outside_loyalty") => setForm({ ...form, loyaltyScope: v })}>
                  <SelectTrigger data-testid="select-offer-loyalty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outside_loyalty">{getLocalizedText("خارج نظام الولاء", "Outside Loyalty", "Hors fidélité")}</SelectItem>
                    <SelectItem value="inside_loyalty">{getLocalizedText("داخل نظام الولاء", "Inside Loyalty", "Dans fidélité")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button 
                onClick={() => {
                  if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
                    toast({ 
                      title: getLocalizedText("خطأ في التاريخ", "Date Error", "Erreur de date"),
                      description: getLocalizedText("تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء", "End date must be after start date", "La date de fin doit être après la date de début"),
                      variant: "destructive" 
                    });
                    return;
                  }
                  editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form);
                }} 
                disabled={createMutation.isPending || updateMutation.isPending || !form.titleAr || !form.startDate || !form.endDate} 
                data-testid="button-save-offer"
              >
                <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {getLocalizedText("حفظ", "Save", "Enregistrer")}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-offer">
                <X className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {getLocalizedText("إلغاء", "Cancel", "Annuler")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : offers && offers.length > 0 ? (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id} className={`${!offer.isActive ? "opacity-60" : ""}`} data-testid={`offer-card-${offer.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{getLocalizedText(offer.titleAr, offer.titleEn, offer.titleFr)}</h3>
                      {isOfferActive(offer) ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {getLocalizedText("نشط الآن", "Active Now", "Actif maintenant")}
                        </Badge>
                      ) : offer.isActive ? (
                        <Badge variant="secondary">{getLocalizedText("مفعّل", "Enabled", "Activé")}</Badge>
                      ) : (
                        <Badge variant="outline">{getLocalizedText("متوقف", "Disabled", "Désactivé")}</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{getLocalizedText(offer.descriptionAr, offer.descriptionEn, offer.descriptionFr)}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      {offer.discountPercentage && (
                        <span className="text-primary font-medium">{offer.discountPercentage}% {getLocalizedText("خصم", "off", "de réduction")}</span>
                      )}
                      {offer.discountAmountKD && (
                        <span className="text-primary font-medium">{offer.discountAmountKD} KD {getLocalizedText("خصم", "off", "de réduction")}</span>
                      )}
                      <span>
                        {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {offer.targetAudience === "all" ? getLocalizedText("الجميع", "All", "Tous") : 
                         offer.targetAudience === "new_customers" ? getLocalizedText("عملاء جدد", "New", "Nouveaux") : 
                         getLocalizedText("عملاء حاليين", "Existing", "Existants")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {offer.loyaltyScope === "inside_loyalty" ? getLocalizedText("داخل الولاء", "In Loyalty", "Fidélité") : getLocalizedText("خارج الولاء", "No Loyalty", "Sans fidélité")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant={offer.isActive ? "secondary" : "default"}
                      onClick={() => toggleActiveMutation.mutate({ id: offer.id, isActive: !offer.isActive })}
                      data-testid={`button-toggle-offer-${offer.id}`}
                    >
                      {offer.isActive ? (
                        <>
                          <Ban className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                          {getLocalizedText("إيقاف", "Disable", "Désactiver")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                          {getLocalizedText("تفعيل", "Enable", "Activer")}
                        </>
                      )}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => { 
                        setEditing(offer); 
                        setForm({
                          titleAr: offer.titleAr,
                          titleEn: offer.titleEn,
                          titleFr: offer.titleFr,
                          descriptionAr: offer.descriptionAr,
                          descriptionEn: offer.descriptionEn,
                          descriptionFr: offer.descriptionFr,
                          discountPercentage: offer.discountPercentage?.toString() || "",
                          discountAmountKD: offer.discountAmountKD?.toString() || "",
                          imageUrl: offer.imageUrl || "",
                          startDate: formatDate(offer.startDate),
                          endDate: formatDate(offer.endDate),
                          isActive: offer.isActive,
                          targetAudience: offer.targetAudience || "all",
                          loyaltyScope: offer.loyaltyScope || "outside_loyalty",
                        });
                        setShowForm(true);
                      }}
                      data-testid={`button-edit-offer-${offer.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      onClick={() => { 
                        if (confirm(getLocalizedText("هل أنت متأكد من حذف هذا العرض؟", "Are you sure you want to delete this offer?", "Êtes-vous sûr de vouloir supprimer cette offre?"))) {
                          deleteMutation.mutate(offer.id);
                        }
                      }}
                      data-testid={`button-delete-offer-${offer.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{getLocalizedText("لا توجد عروض", "No offers yet", "Pas d'offres pour le moment")}</p>
            <Button className="mt-4" onClick={() => setShowForm(true)} data-testid="button-add-first-offer">
              <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {getLocalizedText("إضافة أول عرض", "Add First Offer", "Ajouter la première offre")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Admin Orders Map Component
function AdminOrdersMap({ 
  orders, 
  getLocalizedText, 
  getStatusBadge 
}: { 
  orders: Order[]; 
  getLocalizedText: (ar: string, en: string, fr: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Wait for CSS to load before initializing map
    const initMap = async () => {
      const L = await import("leaflet");
      
      if (leafletMapRef.current) {
        // Clear existing markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
      } else {
        // Initialize map centered on Kuwait
        leafletMapRef.current = L.map(mapRef.current!, {
          center: [29.3759, 47.9774],
          zoom: 11,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(leafletMapRef.current);
      }

      // Add markers for orders with locations
      const ordersWithLocation = orders.filter(o => o.latitude && o.longitude);
      
      if (ordersWithLocation.length > 0) {
        const bounds: [number, number][] = [];
        
        ordersWithLocation.forEach(order => {
          if (!order.latitude || !order.longitude) return;
          
          const statusColors: Record<string, string> = {
            pending: "#eab308",
            assigned: "#3b82f6",
            on_the_way: "#8b5cf6",
            in_progress: "#f97316",
            completed: "#22c55e",
            cancelled: "#ef4444",
          };
          
          const color = statusColors[order.status] || "#6b7280";
          
          // Create custom icon
          const icon = L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
          });

          const marker = L.marker([order.latitude, order.longitude], { icon })
            .addTo(leafletMapRef.current!)
            .bindPopup(`
              <div style="min-width: 180px; direction: rtl; text-align: right;">
                <strong>#${order.id.slice(0, 8)}</strong><br/>
                <span style="color: ${color}; font-weight: bold;">${order.status}</span><br/>
                <span>${order.area}</span><br/>
                <span>${order.preferredTime}</span><br/>
                <strong>${order.priceKD} KD</strong>
              </div>
            `);
          
          markersRef.current.push(marker);
          bounds.push([order.latitude, order.longitude]);
        });

        // Fit map to show all markers
        if (bounds.length > 0) {
          leafletMapRef.current.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
        }
      }
    };

    initMap();

    return () => {
      // Cleanup markers but keep map instance
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [orders]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      className="h-[400px] w-full rounded-lg border"
      data-testid="admin-orders-map"
    />
  );
}
