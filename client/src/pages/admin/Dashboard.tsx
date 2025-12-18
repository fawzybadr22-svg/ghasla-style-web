import { useTranslation } from "react-i18next";
import { useLocation, useRoute } from "wouter";
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Gift, FileText, 
  BarChart3, Shield, Settings, ChevronRight, TrendingUp, TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/:section");
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  
  const section = params?.section || "dashboard";

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
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
    { id: "content", icon: FileText, label: t("admin.content") },
    { id: "analytics", icon: BarChart3, label: t("admin.analytics") },
    ...(isSuperAdmin ? [
      { id: "admins", icon: Shield, label: t("admin.admins") },
      { id: "audit", icon: Settings, label: t("admin.auditLogs") },
    ] : []),
  ];

  const stats = [
    { label: t("admin.totalIncome"), value: "1,250 KD", change: "+12%", positive: true, icon: TrendingUp },
    { label: t("admin.totalOrders"), value: "156", change: "+8%", positive: true, icon: ShoppingBag },
    { label: t("admin.activeCustomers"), value: "89", change: "+15%", positive: true, icon: Users },
    { label: t("admin.pointsIssued"), value: "45,000", change: "-5%", positive: false, icon: Gift },
  ];

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
          <div className="flex-1">
            {section === "dashboard" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <Card key={index} data-testid={`stat-card-${index}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <stat.icon className={`h-5 w-5 ${stat.positive ? "text-green-500" : "text-red-500"}`} />
                          <span className={`text-sm font-medium ${stat.positive ? "text-green-500" : "text-red-500"}`}>
                            {stat.change}
                          </span>
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {getLocalizedText("إجراءات سريعة", "Quick Actions", "Actions Rapides")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setLocation("/admin/orders")}>
                        <ShoppingBag className="h-6 w-6 mb-2" />
                        {getLocalizedText("الطلبات الجديدة", "New Orders", "Nouvelles Commandes")}
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setLocation("/admin/packages")}>
                        <Package className="h-6 w-6 mb-2" />
                        {getLocalizedText("إدارة الباقات", "Manage Packages", "Gérer les Forfaits")}
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setLocation("/admin/customers")}>
                        <Users className="h-6 w-6 mb-2" />
                        {getLocalizedText("العملاء", "Customers", "Clients")}
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setLocation("/admin/analytics")}>
                        <BarChart3 className="h-6 w-6 mb-2" />
                        {getLocalizedText("التقارير", "Reports", "Rapports")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

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
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "سيتم عرض الطلبات هنا",
                        "Orders will be displayed here",
                        "Les commandes seront affichées ici"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "packages" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h1 className="text-2xl font-bold">{t("admin.packages")}</h1>
                  <Button data-testid="add-package">
                    {getLocalizedText("إضافة باقة", "Add Package", "Ajouter un Forfait")}
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "إدارة الباقات والأسعار",
                        "Manage packages and prices",
                        "Gérer les forfaits et les prix"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "orders" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.orders")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "عرض وإدارة جميع الطلبات",
                        "View and manage all orders",
                        "Afficher et gérer toutes les commandes"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "customers" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.customers")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "إدارة العملاء ونقاط الولاء",
                        "Manage customers and loyalty points",
                        "Gérer les clients et les points de fidélité"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "loyalty" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.loyalty")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "إعدادات برنامج الولاء والإحالات",
                        "Loyalty and referral program settings",
                        "Paramètres du programme de fidélité et de parrainage"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "content" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.content")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "إدارة المدونة والشهادات والمعرض",
                        "Manage blog, testimonials, and gallery",
                        "Gérer le blog, les témoignages et la galerie"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "analytics" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.analytics")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "التقارير والإحصائيات التفصيلية",
                        "Detailed reports and statistics",
                        "Rapports et statistiques détaillés"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "admins" && isSuperAdmin && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("admin.admins")}</h1>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "إدارة حسابات المشرفين",
                        "Manage admin accounts",
                        "Gérer les comptes administrateurs"
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
                    <p className="text-muted-foreground text-center py-8">
                      {getLocalizedText(
                        "سجل جميع العمليات الحساسة",
                        "Log of all sensitive operations",
                        "Journal de toutes les opérations sensibles"
                      )}
                    </p>
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
