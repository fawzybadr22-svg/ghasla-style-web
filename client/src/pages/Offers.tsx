import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Tag, Calendar, Users, Gift, ShoppingCart } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Offer } from "@shared/schema";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Offers() {
  const { i18n } = useTranslation();

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ["/api/offers/active"],
  });

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, { ar: string; en: string; fr: string }> = {
      all: { ar: "للجميع", en: "For Everyone", fr: "Pour tous" },
      new_customers: { ar: "للعملاء الجدد", en: "New Customers", fr: "Nouveaux clients" },
      existing_customers: { ar: "للعملاء الحاليين", en: "Existing Customers", fr: "Clients existants" },
    };
    const label = labels[audience] || labels.all;
    return getLocalizedText(label.ar, label.en, label.fr);
  };

  const getLoyaltyLabel = (scope: string) => {
    const labels: Record<string, { ar: string; en: string; fr: string }> = {
      inside_loyalty: { ar: "ضمن نظام الولاء", en: "Loyalty Program", fr: "Programme fidélité" },
      outside_loyalty: { ar: "متاح للجميع", en: "Open to All", fr: "Ouvert à tous" },
    };
    const label = labels[scope] || labels.outside_loyalty;
    return getLocalizedText(label.ar, label.en, label.fr);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Tag className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {getLocalizedText("عروضنا الحصرية", "Our Exclusive Offers", "Nos Offres Exclusives")}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {getLocalizedText(
                  "استفد من عروضنا المميزة واحصل على أفضل خدمات غسيل السيارات بأسعار استثنائية",
                  "Take advantage of our special offers and get the best car wash services at exceptional prices",
                  "Profitez de nos offres spéciales et obtenez les meilleurs services de lavage auto à des prix exceptionnels"
                )}
              </p>
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : offers && offers.length > 0 ? (
              <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {offers.map((offer) => (
                  <motion.div key={offer.id} variants={fadeInUp}>
                    <Card className="overflow-hidden h-full border-2 border-primary/10 hover-elevate" data-testid={`offer-page-card-${offer.id}`}>
                      {offer.imageUrl && (
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={offer.imageUrl} 
                            alt={getLocalizedText(offer.titleAr, offer.titleEn, offer.titleFr)} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          {(offer.discountPercentage || offer.discountAmountKD) && (
                            <div className="absolute top-4 end-4">
                              <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                                {offer.discountPercentage ? `${offer.discountPercentage}%` : `${offer.discountAmountKD} KD`}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                      <CardContent className={`${offer.imageUrl ? "pt-4" : "pt-6"} pb-6 flex flex-col h-full`}>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">
                            {getLocalizedText(offer.titleAr, offer.titleEn, offer.titleFr)}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {getLocalizedText(offer.descriptionAr, offer.descriptionEn, offer.descriptionFr)}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {getAudienceLabel(offer.targetAudience || "all")}
                            </Badge>
                            <Badge 
                              variant={offer.loyaltyScope === "inside_loyalty" ? "secondary" : "outline"} 
                              className="flex items-center gap-1"
                            >
                              <Gift className="h-3 w-3" />
                              {getLoyaltyLabel(offer.loyaltyScope || "outside_loyalty")}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {getLocalizedText("صالح حتى:", "Valid until:", "Valable jusqu'au:")} {new Date(offer.endDate).toLocaleDateString(i18n.language === "ar" ? "ar-KW" : i18n.language === "fr" ? "fr-FR" : "en-US")}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link href="/booking" className="flex-1">
                            <Button className="w-full" data-testid={`offer-page-book-regular-${offer.id}`}>
                              <ShoppingCart className="h-5 w-5 me-2" />
                              {getLocalizedText("احجز الآن", "Book Now", "Réserver")}
                            </Button>
                          </Link>
                          <a 
                            href="https://wa.me/96597960808" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button variant="outline" className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10" data-testid={`offer-page-book-whatsapp-${offer.id}`}>
                              <SiWhatsapp className="h-5 w-5 me-2" />
                              {getLocalizedText("واتساب", "WhatsApp", "WhatsApp")}
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div variants={fadeInUp}>
                <Card className="text-center py-16">
                  <CardContent>
                    <Tag className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                    <h2 className="text-2xl font-bold mb-3">
                      {getLocalizedText("لا توجد عروض حالياً", "No Active Offers", "Aucune offre active")}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {getLocalizedText(
                        "ترقبوا عروضنا القادمة! تابعونا على واتساب للحصول على آخر العروض",
                        "Stay tuned for upcoming offers! Follow us on WhatsApp for the latest deals",
                        "Restez à l'écoute pour les prochaines offres! Suivez-nous sur WhatsApp"
                      )}
                    </p>
                    <a href="https://wa.me/96597960808" target="_blank" rel="noopener noreferrer">
                      <Button className="bg-[#25D366] hover:bg-[#20BD5A]">
                        <SiWhatsapp className="h-5 w-5 me-2" />
                        {getLocalizedText("تواصل معنا", "Contact Us", "Contactez-nous")}
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
