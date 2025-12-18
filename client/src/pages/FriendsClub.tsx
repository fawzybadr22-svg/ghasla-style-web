import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Users, Share2, UserPlus, Gift, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function FriendsClub() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const referralCode = user?.referralCode || "GHASLA2024";
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      icon: Share2,
      number: 1,
      titleAr: "شارك رابطك",
      titleEn: "Share Your Link",
      titleFr: "Partagez Votre Lien",
      descAr: "أرسل رابط الإحالة الخاص بك لأصدقائك وعائلتك",
      descEn: "Send your referral link to friends and family",
      descFr: "Envoyez votre lien de parrainage à vos amis et famille",
    },
    {
      icon: UserPlus,
      number: 2,
      titleAr: "صديقك يسجل",
      titleEn: "Friend Signs Up",
      titleFr: "L'ami S'inscrit",
      descAr: "عندما يسجل صديقك باستخدام رابطك",
      descEn: "When your friend registers using your link",
      descFr: "Quand votre ami s'inscrit via votre lien",
    },
    {
      icon: Gift,
      number: 3,
      titleAr: "كلاكما يربح",
      titleEn: "Both Win",
      titleFr: "Vous Gagnez Tous Les Deux",
      descAr: "عند أول طلب مدفوع، تحصل على 400 نقطة وصديقك على 200 نقطة",
      descEn: "On first paid order, you get 400 points and your friend gets 200 points",
      descFr: "À la première commande payée, vous recevez 400 points et votre ami 200 points",
    },
  ];

  const benefits = [
    {
      valueAr: "400",
      valueEn: "400",
      valueFr: "400",
      labelAr: "نقطة للمُحيل",
      labelEn: "Points for Referrer",
      labelFr: "Points pour le Parrain",
    },
    {
      valueAr: "200",
      valueEn: "200",
      valueFr: "200",
      labelAr: "نقطة للصديق",
      labelEn: "Points for Friend",
      labelFr: "Points pour l'Ami",
    },
    {
      valueAr: "∞",
      valueEn: "∞",
      valueFr: "∞",
      labelAr: "بدون حدود",
      labelEn: "Unlimited",
      labelFr: "Illimité",
    },
  ];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-chart-1/10 mb-6">
            <Users className="h-10 w-10 text-chart-1" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("friendsClub.title")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("friendsClub.subtitle")}
          </p>
        </div>

        {/* Benefits Summary */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center" data-testid={`benefit-${index}`}>
              <CardContent className="pt-6">
                <p className="text-4xl font-bold text-chart-1 mb-2">
                  {getLocalizedText(benefit.valueAr, benefit.valueEn, benefit.valueFr)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getLocalizedText(benefit.labelAr, benefit.labelEn, benefit.labelFr)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">{t("friendsClub.howItWorks")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <Card key={index} className="text-center" data-testid={`step-card-${index}`}>
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-chart-1/10 flex items-center justify-center mb-4">
                    <step.icon className="h-8 w-8 text-chart-1" />
                  </div>
                  <div className="mx-auto w-8 h-8 rounded-full bg-chart-1 flex items-center justify-center text-white font-bold text-sm -mt-12 mb-4 relative z-10">
                    {step.number}
                  </div>
                  <CardTitle className="text-lg">
                    {getLocalizedText(step.titleAr, step.titleEn, step.titleFr)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {getLocalizedText(step.descAr, step.descEn, step.descFr)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Referral Link Section */}
        {user ? (
          <div className="max-w-2xl mx-auto mb-16">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-chart-1 to-chart-1/80 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{t("friendsClub.yourLink")}</h3>
                <p className="opacity-90 text-sm">
                  {getLocalizedText(
                    "شارك هذا الرابط مع أصدقائك",
                    "Share this link with your friends",
                    "Partagez ce lien avec vos amis"
                  )}
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("friendsClub.yourCode")}</label>
                  <div className="p-3 bg-muted rounded-lg font-mono text-lg text-center">
                    {referralCode}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("friendsClub.yourLink")}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono"
                      dir="ltr"
                    />
                    <Button onClick={copyToClipboard} data-testid="copy-referral-link">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="ms-2">{copied ? t("friendsClub.copied") : t("friendsClub.copyLink")}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center mb-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-chart-1 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {getLocalizedText(
                    "سجل للحصول على رابط الإحالة",
                    "Register to Get Your Referral Link",
                    "Inscrivez-vous pour Obtenir Votre Lien"
                  )}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {getLocalizedText(
                    "أنشئ حساباً لبدء دعوة أصدقائك وكسب النقاط",
                    "Create an account to start inviting friends and earning points",
                    "Créez un compte pour commencer à inviter des amis et gagner des points"
                  )}
                </p>
                <Link href="/register">
                  <Button className="w-full" data-testid="friends-club-register">
                    {t("auth.register")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            {getLocalizedText("أسئلة شائعة", "Frequently Asked Questions", "Questions Fréquentes")}
          </h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">
                  {getLocalizedText(
                    "متى أحصل على النقاط؟",
                    "When do I get the points?",
                    "Quand est-ce que je reçois les points?"
                  )}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {getLocalizedText(
                    "تحصل على النقاط فور إتمام صديقك لأول طلب مدفوع",
                    "You receive points as soon as your friend completes their first paid order",
                    "Vous recevez les points dès que votre ami termine sa première commande payée"
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">
                  {getLocalizedText(
                    "هل هناك حد لعدد الإحالات؟",
                    "Is there a limit on referrals?",
                    "Y a-t-il une limite aux parrainages?"
                  )}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {getLocalizedText(
                    "لا، يمكنك دعوة عدد غير محدود من الأصدقاء وكسب نقاط على كل إحالة ناجحة",
                    "No, you can invite unlimited friends and earn points on every successful referral",
                    "Non, vous pouvez inviter un nombre illimité d'amis et gagner des points sur chaque parrainage réussi"
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
