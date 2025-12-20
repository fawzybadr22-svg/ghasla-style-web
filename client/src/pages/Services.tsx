import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Car, Sparkles, Star, Crown, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServicePackage } from "@shared/schema";

const categoryIcons: Record<string, typeof Car> = {
  exterior: Car,
  interior: Sparkles,
  full: Star,
  vip: Crown,
  monthly: Calendar,
};

const defaultPackages: ServicePackage[] = [
  {
    id: "1",
    nameAr: "غسيل خارجي",
    nameEn: "Exterior Wash",
    nameFr: "Lavage Extérieur",
    descriptionAr: "غسيل خارجي شامل للسيارة مع تنظيف الإطارات والجنوط",
    descriptionEn: "Complete exterior wash including tires and rims cleaning",
    descriptionFr: "Lavage extérieur complet incluant pneus et jantes",
    priceSedanKD: 3.5,
    priceSuvKD: 4.5,
    estimatedMinutes: 30,
    category: "exterior",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    nameAr: "تنظيف داخلي",
    nameEn: "Interior Clean",
    nameFr: "Nettoyage Intérieur",
    descriptionAr: "تنظيف داخلي شامل مع كنس وتلميع لوحة القيادة",
    descriptionEn: "Full interior cleaning with vacuuming and dashboard polish",
    descriptionFr: "Nettoyage intérieur complet avec aspiration et polish tableau de bord",
    priceSedanKD: 5,
    priceSuvKD: 7,
    estimatedMinutes: 45,
    category: "interior",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "3",
    nameAr: "غسيل كامل",
    nameEn: "Full Wash",
    nameFr: "Lavage Complet",
    descriptionAr: "غسيل خارجي وتنظيف داخلي شامل",
    descriptionEn: "Complete exterior wash and interior cleaning",
    descriptionFr: "Lavage extérieur complet et nettoyage intérieur",
    priceSedanKD: 7,
    priceSuvKD: 10,
    estimatedMinutes: 60,
    category: "full",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "4",
    nameAr: "VIP / تفصيلي",
    nameEn: "VIP / Detailing",
    nameFr: "VIP / Détaillage",
    descriptionAr: "تنظيف تفصيلي شامل مع تلميع وحماية",
    descriptionEn: "Complete detailing with polish and protection",
    descriptionFr: "Détaillage complet avec polish et protection",
    priceSedanKD: 15,
    priceSuvKD: 20,
    estimatedMinutes: 120,
    category: "vip",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "5",
    nameAr: "اشتراك شهري (4 غسلات)",
    nameEn: "Monthly (4 Washes)",
    nameFr: "Mensuel (4 Lavages)",
    descriptionAr: "اشتراك شهري يشمل 4 غسلات خارجية",
    descriptionEn: "Monthly subscription with 4 exterior washes",
    descriptionFr: "Abonnement mensuel avec 4 lavages extérieurs",
    priceSedanKD: 10,
    priceSuvKD: 14,
    estimatedMinutes: 30,
    category: "monthly",
    isActive: true,
    createdAt: new Date(),
  },
];

export default function Services() {
  const { t, i18n } = useTranslation();

  const { data: packages, isLoading } = useQuery<ServicePackage[]>({
    queryKey: ["/api/packages"],
  });

  const displayPackages = packages?.length ? packages : defaultPackages;

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { ar: string; en: string; fr: string }> = {
      exterior: { ar: "خارجي", en: "Exterior", fr: "Extérieur" },
      interior: { ar: "داخلي", en: "Interior", fr: "Intérieur" },
      full: { ar: "كامل", en: "Full", fr: "Complet" },
      vip: { ar: "VIP", en: "VIP", fr: "VIP" },
      monthly: { ar: "شهري", en: "Monthly", fr: "Mensuel" },
    };
    const label = labels[category] || labels.exterior;
    return getLocalizedText(label.ar, label.en, label.fr);
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-14 w-14 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("services.title")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("services.subtitle")}
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPackages.filter(p => p.isActive).map((pkg) => {
            const Icon = categoryIcons[pkg.category] || Car;
            return (
              <Card key={pkg.id} className="flex flex-col hover-elevate" data-testid={`package-card-${pkg.id}`}>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <Badge variant="secondary" className="mx-auto mb-2">
                    {getCategoryLabel(pkg.category)}
                  </Badge>
                  <CardTitle className="text-xl">
                    {getLocalizedText(pkg.nameAr, pkg.nameEn, pkg.nameFr)}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {getLocalizedText(pkg.descriptionAr, pkg.descriptionEn, pkg.descriptionFr)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">{t("services.sedan")}</span>
                      <span className="text-lg font-bold text-primary">
                        {pkg.priceSedanKD} {t("services.kd")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">{t("services.suv")}</span>
                      <span className="text-lg font-bold text-primary">
                        {pkg.priceSuvKD} {t("services.kd")}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <Clock className="h-4 w-4" />
                      <span>
                        {t("services.duration")}: {pkg.estimatedMinutes} {t("services.minutes")}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Link href={`/booking?package=${pkg.id}`} className="w-full">
                    <Button className="w-full" data-testid={`select-package-${pkg.id}`}>
                      {t("services.select")}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            {getLocalizedText(
              "لا تجد ما تبحث عنه؟ تواصل معنا للحصول على عرض مخصص",
              "Can't find what you're looking for? Contact us for a custom quote",
              "Vous ne trouvez pas ce que vous cherchez? Contactez-nous pour un devis personnalisé"
            )}
          </p>
          <Link href="/contact">
            <Button variant="outline" size="lg" data-testid="contact-for-quote">
              {t("nav.contact")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
