import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Gift, Star, Coins, Award, ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loyalty() {
  const { t, i18n } = useTranslation();

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const steps = [
    {
      icon: Star,
      number: 1,
      titleAr: "احجز خدمتك",
      titleEn: "Book Your Service",
      titleFr: "Réservez Votre Service",
      descAr: "اختر الباقة المناسبة واحجز موعدك",
      descEn: "Choose the right package and book your appointment",
      descFr: "Choisissez le forfait adapté et réservez votre rendez-vous",
    },
    {
      icon: Coins,
      number: 2,
      titleAr: "اكسب النقاط",
      titleEn: "Earn Points",
      titleFr: "Gagnez des Points",
      descAr: "احصل على 35 نقطة لكل دينار تنفقه",
      descEn: "Get 35 points for every KD you spend",
      descFr: "Obtenez 35 points pour chaque KD dépensé",
    },
    {
      icon: Gift,
      number: 3,
      titleAr: "استبدل واستمتع",
      titleEn: "Redeem & Enjoy",
      titleFr: "Échangez & Profitez",
      descAr: "استخدم نقاطك للحصول على خصومات",
      descEn: "Use your points to get discounts",
      descFr: "Utilisez vos points pour obtenir des réductions",
    },
  ];

  const benefits = [
    {
      icon: Award,
      titleAr: "مكافأة ترحيب",
      titleEn: "Welcome Bonus",
      titleFr: "Bonus de Bienvenue",
      valueAr: "200 نقطة",
      valueEn: "200 Points",
      valueFr: "200 Points",
      descAr: "عند أول طلب مدفوع",
      descEn: "On your first paid order",
      descFr: "Sur votre première commande payée",
    },
    {
      icon: Coins,
      titleAr: "نقاط لكل دينار",
      titleEn: "Points per KD",
      titleFr: "Points par KD",
      valueAr: "35 نقطة",
      valueEn: "35 Points",
      valueFr: "35 Points",
      descAr: "على كل دينار تنفقه",
      descEn: "For every KD spent",
      descFr: "Pour chaque KD dépensé",
    },
    {
      icon: Calculator,
      titleAr: "قيمة النقاط",
      titleEn: "Points Value",
      titleFr: "Valeur des Points",
      valueAr: "100 = 0.4 د.ك",
      valueEn: "100 = 0.4 KD",
      valueFr: "100 = 0.4 KD",
      descAr: "كل 100 نقطة تساوي 0.4 د.ك",
      descEn: "Every 100 points = 0.4 KD",
      descFr: "Chaque 100 points = 0.4 KD",
    },
  ];

  const examples = [
    {
      titleAr: "مثال: غسيل كامل (7 د.ك)",
      titleEn: "Example: Full Wash (7 KD)",
      titleFr: "Exemple: Lavage Complet (7 KD)",
      pointsAr: "تكسب 245 نقطة",
      pointsEn: "You earn 245 points",
      pointsFr: "Vous gagnez 245 points",
      calcAr: "7 × 35 = 245 نقطة",
      calcEn: "7 × 35 = 245 points",
      calcFr: "7 × 35 = 245 points",
    },
    {
      titleAr: "مثال: استخدام النقاط",
      titleEn: "Example: Using Points",
      titleFr: "Exemple: Utilisation des Points",
      pointsAr: "500 نقطة = 2 د.ك خصم",
      pointsEn: "500 points = 2 KD discount",
      pointsFr: "500 points = 2 KD de réduction",
      calcAr: "500 ÷ 100 × 0.4 = 2 د.ك",
      calcEn: "500 ÷ 100 × 0.4 = 2 KD",
      calcFr: "500 ÷ 100 × 0.4 = 2 KD",
    },
  ];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("loyalty.title")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("loyalty.subtitle")}
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">{t("loyalty.howItWorks")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center" data-testid={`loyalty-step-${index}`}>
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {getLocalizedText(step.titleAr, step.titleEn, step.titleFr)}
                </h3>
                <p className="text-muted-foreground">
                  {getLocalizedText(step.descAr, step.descEn, step.descFr)}
                </p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -end-4 h-6 w-6 text-muted-foreground rtl:rotate-180" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center" data-testid={`benefit-card-${index}`}>
                <CardHeader>
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">
                    {getLocalizedText(benefit.titleAr, benefit.titleEn, benefit.titleFr)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary mb-2">
                    {getLocalizedText(benefit.valueAr, benefit.valueEn, benefit.valueFr)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {getLocalizedText(benefit.descAr, benefit.descEn, benefit.descFr)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            {getLocalizedText("أمثلة عملية", "Practical Examples", "Exemples Pratiques")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {examples.map((example, index) => (
              <Card key={index} className="bg-muted/30" data-testid={`example-card-${index}`}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">
                    {getLocalizedText(example.titleAr, example.titleEn, example.titleFr)}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-primary font-medium">
                      {getLocalizedText(example.pointsAr, example.pointsEn, example.pointsFr)}
                    </p>
                    <p className="text-muted-foreground text-sm font-mono">
                      {getLocalizedText(example.calcAr, example.calcEn, example.calcFr)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-primary to-chart-1 rounded-2xl p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {getLocalizedText(
              "ابدأ بجمع النقاط اليوم!",
              "Start Earning Points Today!",
              "Commencez à Gagner des Points Aujourd'hui!"
            )}
          </h2>
          <p className="text-lg opacity-90 mb-6">
            {getLocalizedText(
              "سجل الآن واحصل على مكافأة الترحيب",
              "Register now and get your welcome bonus",
              "Inscrivez-vous maintenant et obtenez votre bonus de bienvenue"
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" data-testid="loyalty-register">
                {t("auth.register")}
              </Button>
            </Link>
            <Link href="/booking">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" data-testid="loyalty-book">
                {t("nav.booking")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
