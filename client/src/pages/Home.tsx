import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Car, Sparkles, Gift, Users, Star, Clock, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const features = [
    {
      icon: Car,
      titleAr: "خدمة متنقلة",
      titleEn: "Mobile Service",
      titleFr: "Service Mobile",
      descAr: "نأتي إليك أينما كنت في الكويت",
      descEn: "We come to you anywhere in Kuwait",
      descFr: "Nous venons à vous partout au Koweït",
    },
    {
      icon: Sparkles,
      titleAr: "جودة عالية",
      titleEn: "Premium Quality",
      titleFr: "Qualité Premium",
      descAr: "منتجات وتقنيات احترافية",
      descEn: "Professional products and techniques",
      descFr: "Produits et techniques professionnels",
    },
    {
      icon: Gift,
      titleAr: "برنامج مكافآت",
      titleEn: "Rewards Program",
      titleFr: "Programme de Récompenses",
      descAr: "اكسب نقاطاً مع كل خدمة",
      descEn: "Earn points with every service",
      descFr: "Gagnez des points à chaque service",
    },
    {
      icon: Users,
      titleAr: "نادي الأصدقاء",
      titleEn: "Friends Club",
      titleFr: "Club des Amis",
      descAr: "ادعُ أصدقاءك واربح المزيد",
      descEn: "Invite friends and earn more",
      descFr: "Invitez des amis et gagnez plus",
    },
  ];

  const stats = [
    { value: "5000+", labelAr: "عميل سعيد", labelEn: "Happy Customers", labelFr: "Clients Satisfaits" },
    { value: "10000+", labelAr: "غسلة مكتملة", labelEn: "Washes Completed", labelFr: "Lavages Terminés" },
    { value: "4.9", labelAr: "تقييم العملاء", labelEn: "Customer Rating", labelFr: "Note Client" },
    { value: "30+", labelAr: "منطقة نخدمها", labelEn: "Areas Covered", labelFr: "Zones Couvertes" },
  ];

  const services = [
    {
      nameAr: "غسيل خارجي",
      nameEn: "Exterior Wash",
      nameFr: "Lavage Extérieur",
      priceFrom: "3",
      icon: Car,
    },
    {
      nameAr: "تنظيف داخلي",
      nameEn: "Interior Clean",
      nameFr: "Nettoyage Intérieur",
      priceFrom: "5",
      icon: Sparkles,
    },
    {
      nameAr: "غسيل كامل",
      nameEn: "Full Wash",
      nameFr: "Lavage Complet",
      priceFrom: "7",
      icon: Star,
    },
  ];

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-chart-1/10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Qzk2QUEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkgy NHYtMmgxMnptMC00djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>{getLocalizedText("الأولى في الكويت", "First in Kuwait", "Premier au Koweït")}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {t("hero.title")}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {t("hero.description")}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/booking">
                <Button size="lg" className="text-lg px-8 py-6" data-testid="hero-book-now">
                  {t("hero.bookNow")}
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6" data-testid="hero-learn-more">
                  {t("hero.learnMore")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -start-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -top-20 -end-20 w-72 h-72 bg-chart-1/20 rounded-full blur-3xl" />
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground text-sm">
                  {getLocalizedText(stat.labelAr, stat.labelEn, stat.labelFr)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {getLocalizedText("لماذا غسلة ستايل؟", "Why Ghasla Style?", "Pourquoi Ghasla Style?")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {getLocalizedText(
                "نقدم لكم أفضل خدمة غسيل سيارات متنقلة في الكويت",
                "We offer the best mobile car wash service in Kuwait",
                "Nous offrons le meilleur service de lavage auto mobile au Koweït"
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover-elevate" data-testid={`feature-card-${index}`}>
                <CardHeader>
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    {getLocalizedText(feature.titleAr, feature.titleEn, feature.titleFr)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {getLocalizedText(feature.descAr, feature.descEn, feature.descFr)}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("services.title")}</h2>
            <p className="text-muted-foreground text-lg">{t("services.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {services.map((service, index) => (
              <Card key={index} className="hover-elevate" data-testid={`service-preview-${index}`}>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center mb-4">
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>
                    {getLocalizedText(service.nameAr, service.nameEn, service.nameFr)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {getLocalizedText("من ", "From ", "À partir de ")}
                    {service.priceFrom} {t("services.kd")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services">
              <Button size="lg" variant="outline" data-testid="view-all-services">
                {getLocalizedText("عرض جميع الخدمات", "View All Services", "Voir Tous les Services")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Loyalty & Friends Club Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Loyalty Program */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
                <Gift className="h-12 w-12 mb-4" />
                <h3 className="text-2xl font-bold mb-2">{t("loyalty.title")}</h3>
                <p className="opacity-90">{t("loyalty.subtitle")}</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{t("loyalty.earnTitle")}</h4>
                    <p className="text-muted-foreground text-sm">{t("loyalty.earnDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{t("loyalty.redeemTitle")}</h4>
                    <p className="text-muted-foreground text-sm">{t("loyalty.redeemDesc")}</p>
                  </div>
                </div>
                <Link href="/loyalty">
                  <Button className="w-full mt-4" data-testid="learn-loyalty">
                    {t("hero.learnMore")}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Friends Club */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-chart-1 to-chart-1/80 p-8 text-white">
                <Users className="h-12 w-12 mb-4" />
                <h3 className="text-2xl font-bold mb-2">{t("friendsClub.title")}</h3>
                <p className="opacity-90">{t("friendsClub.subtitle")}</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-chart-1 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t("friendsClub.step1Title")}</h4>
                    <p className="text-muted-foreground text-sm">{t("friendsClub.step1Desc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-chart-1 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t("friendsClub.step2Title")}</h4>
                    <p className="text-muted-foreground text-sm">{t("friendsClub.step2Desc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-chart-1 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t("friendsClub.step3Title")}</h4>
                    <p className="text-muted-foreground text-sm">{t("friendsClub.step3Desc")}</p>
                  </div>
                </div>
                <Link href="/friends-club">
                  <Button variant="outline" className="w-full mt-4 border-chart-1 text-chart-1 hover:bg-chart-1/10" data-testid="learn-friends-club">
                    {t("hero.learnMore")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-chart-1 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {getLocalizedText(
              "جاهز لتجربة أفضل غسيل سيارات؟",
              "Ready for the Best Car Wash?",
              "Prêt pour le Meilleur Lavage Auto?"
            )}
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            {getLocalizedText(
              "احجز الآن واستمتع بخدمة متميزة ونظام مكافآت حصري",
              "Book now and enjoy premium service with exclusive rewards",
              "Réservez maintenant et profitez d'un service premium avec des récompenses exclusives"
            )}
          </p>
          <Link href="/booking">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="cta-book-now">
              {t("hero.bookNow")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm">{getLocalizedText("منتجات آمنة", "Safe Products", "Produits Sûrs")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm">{getLocalizedText("خدمة سريعة", "Fast Service", "Service Rapide")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm">{getLocalizedText("تغطية شاملة", "Full Coverage", "Couverture Complète")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-sm">{getLocalizedText("جودة مضمونة", "Quality Guaranteed", "Qualité Garantie")}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
