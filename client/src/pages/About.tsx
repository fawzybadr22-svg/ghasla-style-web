import { useTranslation } from "react-i18next";
import { Target, MapPin, Award, Users, Leaf, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  const { t, i18n } = useTranslation();

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const values = [
    {
      icon: Award,
      titleAr: "جودة عالية",
      titleEn: "Premium Quality",
      titleFr: "Qualité Premium",
      descAr: "نستخدم أفضل المنتجات والتقنيات لضمان نتائج مبهرة",
      descEn: "We use the best products and techniques for amazing results",
      descFr: "Nous utilisons les meilleurs produits et techniques pour des résultats exceptionnels",
    },
    {
      icon: Leaf,
      titleAr: "صديق للبيئة",
      titleEn: "Eco-Friendly",
      titleFr: "Écologique",
      descAr: "منتجات آمنة على البيئة وتقنيات توفير المياه",
      descEn: "Environmentally safe products and water-saving techniques",
      descFr: "Produits écologiques et techniques d'économie d'eau",
    },
    {
      icon: Clock,
      titleAr: "توفير الوقت",
      titleEn: "Time Saving",
      titleFr: "Gain de Temps",
      descAr: "نأتي إليك ونوفر عليك عناء الذهاب لمغسلة السيارات",
      descEn: "We come to you, saving you the hassle of going to a car wash",
      descFr: "Nous venons à vous, vous évitant d'aller au lavage auto",
    },
    {
      icon: Users,
      titleAr: "فريق محترف",
      titleEn: "Professional Team",
      titleFr: "Équipe Professionnelle",
      descAr: "فريق مدرب ومؤهل لتقديم أفضل خدمة",
      descEn: "Trained and qualified team for the best service",
      descFr: "Équipe formée et qualifiée pour le meilleur service",
    },
  ];

  const areas = [
    { ar: "السالمية", en: "Salmiya", fr: "Salmiya" },
    { ar: "الروضة", en: "Rawda", fr: "Rawda" },
    { ar: "السرة", en: "Surra", fr: "Surra" },
    { ar: "كيفان", en: "Kaifan", fr: "Kaifan" },
    { ar: "الخالدية", en: "Khaldiya", fr: "Khaldiya" },
    { ar: "القادسية", en: "Qadisiya", fr: "Qadisiya" },
  ];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("about.title")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("about.subtitle")}
          </p>
        </div>

        {/* Mission */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-chart-1 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <Target className="h-10 w-10" />
                <h2 className="text-2xl font-bold">{t("about.mission")}</h2>
              </div>
              <p className="text-lg opacity-90 leading-relaxed">
                {t("about.missionText")}
              </p>
            </div>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            {getLocalizedText("قيمنا", "Our Values", "Nos Valeurs")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center" data-testid={`value-card-${index}`}>
                <CardHeader>
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">
                    {getLocalizedText(value.titleAr, value.titleEn, value.titleFr)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {getLocalizedText(value.descAr, value.descEn, value.descFr)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coverage */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-chart-1/10 flex items-center justify-center mb-4">
                <MapPin className="h-7 w-7 text-chart-1" />
              </div>
              <CardTitle className="text-2xl">{t("about.coverage")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-6">
                {t("about.coverageText")}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {areas.map((area, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-muted rounded-full text-sm font-medium"
                    data-testid={`area-badge-${index}`}
                  >
                    {getLocalizedText(area.ar, area.en, area.fr)}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
