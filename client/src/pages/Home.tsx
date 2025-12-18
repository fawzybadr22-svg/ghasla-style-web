import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Car, Sparkles, Crown, Calendar, MapPin, Clock, Shield, Star, 
  Users, Truck, Phone, X, Check, ChevronDown, MessageCircle, Search, Package
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import heroImage from "@assets/generated_images/luxury_car_with_water_droplets.png";
import fleetImage from "@assets/generated_images/branded_mobile_wash_van.png";
import beforeAfterExterior from "@assets/generated_images/range_rover_wash_comparison.png";
import beforeAfterInterior from "@assets/generated_images/bmw_interior_cleaning_comparison.png";
import beforeAfterDetailing from "@assets/generated_images/mercedes_detailing_before_after.png";
import serviceExteriorBg from "@assets/generated_images/premium_sedan_car_wash.png";
import serviceInteriorBg from "@assets/generated_images/premium_car_interior_clean.png";
import serviceVipBg from "@assets/generated_images/luxury_suv_detailing_studio.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// Order tracking types
interface TrackedOrder {
  id: string;
  status: string;
  carType: string;
  preferredDate: string;
  preferredTime: string;
  area: string;
  createdAt: string;
  completedAt: string | null;
  assignedDriver: string | null;
  serviceName: { ar: string; en: string; fr: string } | null;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [showOffer, setShowOffer] = useState(false);
  const [carType, setCarType] = useState<"sedan" | "suv">("sedan");
  const [service, setService] = useState("full");
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [sliderPositions, setSliderPositions] = useState<{[key: number]: number}>({1: 50, 2: 50, 3: 50});
  
  // Order tracking state
  const [trackingId, setTrackingId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [isTracking, setIsTracking] = useState(false);

  const handleTrackOrder = async () => {
    if (!trackingId.trim()) {
      setTrackingError(getLocalizedText(
        "الرجاء إدخال رقم الطلب",
        "Please enter an order ID",
        "Veuillez entrer un numéro de commande"
      ));
      return;
    }
    
    setIsTracking(true);
    setTrackingError("");
    setTrackedOrder(null);
    
    try {
      const response = await fetch(`/api/orders/track/${trackingId.trim()}`);
      if (!response.ok) {
        throw new Error("not_found");
      }
      const data = await response.json();
      setTrackedOrder(data);
    } catch (error) {
      setTrackingError(getLocalizedText(
        "الطلب غير موجود - يرجى التحقق من رقم الطلب أو تسجيل الدخول إلى حسابك",
        "Order not found – please check your ID or log in to your account",
        "Commande non trouvée – veuillez vérifier votre numéro ou vous connecter"
      ));
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ["pending", "assigned", "in_progress", "completed"];
    return steps.indexOf(status) + 1;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string; fr: string }> = {
      pending: { ar: "قيد الانتظار", en: "Pending", fr: "En attente" },
      assigned: { ar: "تم التخصيص", en: "Assigned", fr: "Assigné" },
      in_progress: { ar: "قيد التنفيذ", en: "In Progress", fr: "En cours" },
      completed: { ar: "مكتمل", en: "Completed", fr: "Terminé" },
      cancelled: { ar: "ملغي", en: "Cancelled", fr: "Annulé" },
    };
    const label = labels[status] || labels.pending;
    return getLocalizedText(label.ar, label.en, label.fr);
  };

  const handleSliderChange = (id: number, value: number) => {
    setSliderPositions(prev => ({ ...prev, [id]: value }));
  };

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  useEffect(() => {
    const hasSeenOffer = localStorage.getItem("ghasla_offer_seen");
    if (!hasSeenOffer) {
      const timer = setTimeout(() => setShowOffer(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeOffer = () => {
    setShowOffer(false);
    localStorage.setItem("ghasla_offer_seen", "true");
  };

  const services = [
    { id: "exterior", nameAr: "غسيل خارجي", nameEn: "Exterior Wash", nameFr: "Lavage Extérieur", sedanPrice: 3, suvPrice: 4 },
    { id: "interior", nameAr: "تنظيف داخلي", nameEn: "Interior Clean", nameFr: "Nettoyage Intérieur", sedanPrice: 5, suvPrice: 7 },
    { id: "full", nameAr: "غسيل كامل", nameEn: "Full Wash", nameFr: "Lavage Complet", sedanPrice: 7, suvPrice: 10 },
    { id: "vip", nameAr: "VIP / تفصيلي", nameEn: "VIP Detailing", nameFr: "Détaillage VIP", sedanPrice: 15, suvPrice: 20 },
    { id: "monthly", nameAr: "اشتراك شهري", nameEn: "Monthly Package", nameFr: "Forfait Mensuel", sedanPrice: 10, suvPrice: 14 },
  ];

  const selectedService = services.find(s => s.id === service) || services[2];
  const currentPrice = carType === "suv" ? selectedService.suvPrice : selectedService.sedanPrice;

  const fleetStats = [
    { value: "20", labelAr: "دقيقة متوسط الوصول", labelEn: "Min Avg Arrival", labelFr: "Min Arrivée Moy" },
    { value: "5", labelAr: "سيارات مجهزة", labelEn: "Equipped Vans", labelFr: "Fourgons Équipés" },
    { value: "24/7", labelAr: "دعم متواصل", labelEn: "Support", labelFr: "Support" },
  ];

  const serviceCards = [
    {
      icon: Car,
      nameAr: "غسيل خارجي",
      nameEn: "Exterior Wash",
      nameFr: "Lavage Extérieur",
      descAr: "غسيل شامل للجسم الخارجي مع تنظيف الإطارات والجنوط وتلميع الزجاج",
      descEn: "Complete exterior wash with tire cleaning, rim shine, and window polish",
      descFr: "Lavage extérieur complet avec nettoyage des pneus et polish vitres",
      features: [
        { ar: "غسيل بالرغوة الكثيفة", en: "Foam wash", fr: "Lavage mousse" },
        { ar: "تنظيف الإطارات والجنوط", en: "Tire & rim clean", fr: "Pneus et jantes" },
        { ar: "تلميع الزجاج", en: "Glass polish", fr: "Polish vitres" },
      ],
      price: 3,
      bgImage: serviceExteriorBg,
    },
    {
      icon: Sparkles,
      nameAr: "تنظيف داخلي",
      nameEn: "Interior Cleaning",
      nameFr: "Nettoyage Intérieur",
      descAr: "تنظيف شامل للمقصورة الداخلية مع كنس وتلميع لوحة القيادة والتعقيم",
      descEn: "Complete interior cleaning with vacuuming, dashboard polish, and sanitization",
      descFr: "Nettoyage intérieur complet avec aspiration et désinfection",
      features: [
        { ar: "كنس شامل", en: "Full vacuuming", fr: "Aspiration complète" },
        { ar: "تلميع لوحة القيادة", en: "Dashboard polish", fr: "Polish tableau" },
        { ar: "تعقيم وتعطير", en: "Sanitize & freshen", fr: "Désinfection" },
      ],
      price: 5,
      bgImage: serviceInteriorBg,
    },
    {
      icon: Crown,
      nameAr: "VIP تفصيلي",
      nameEn: "VIP Detailing",
      nameFr: "Détaillage VIP",
      descAr: "خدمة تفصيلية شاملة مع تلميع السيارة وحماية الطلاء وتنظيف عميق",
      descEn: "Full detailing service with car polish, paint protection, and deep cleaning",
      descFr: "Service détaillé complet avec polish et protection peinture",
      features: [
        { ar: "تلميع وحماية الطلاء", en: "Polish & protect", fr: "Polish & protection" },
        { ar: "تنظيف عميق للمقاعد", en: "Deep seat clean", fr: "Nettoyage sièges" },
        { ar: "تجديد البلاستيك والجلد", en: "Plastic & leather", fr: "Plastique & cuir" },
      ],
      price: 15,
      bgImage: serviceVipBg,
    },
  ];

  const beforeAfterComparisons = [
    {
      id: 1,
      image: beforeAfterDetailing,
      titleAr: "تفصيل كامل",
      titleEn: "Full Detailing",
      titleFr: "Détaillage Complet",
      ctaAr: "حوّل الطلاء الباهت إلى لمعان مرآة كصالة العرض.",
      ctaEn: "Turn dull paint into a mirror-finish showroom shine.",
      ctaFr: "Transformez une peinture terne en une brillance de showroom.",
      whatsappMessageAr: "مرحباً، أريد حجز خدمة التفصيل الكامل.",
      whatsappMessageEn: "Hi, I'd like to book a Full Detailing service.",
      whatsappMessageFr: "Bonjour, je voudrais réserver un service de détaillage complet.",
    },
    {
      id: 2,
      image: beforeAfterInterior,
      titleAr: "تنظيف داخلي عميق",
      titleEn: "Interior Deep Clean",
      titleFr: "Nettoyage Intérieur Profond",
      ctaAr: "استنشق هواءً نقياً في مقصورة نظيفة كل رحلة.",
      ctaEn: "Breathe in a fresh, spotless cabin - every trip.",
      ctaFr: "Respirez un air frais dans un habitacle impeccable.",
      whatsappMessageAr: "مرحباً، أريد حجز خدمة التنظيف الداخلي العميق.",
      whatsappMessageEn: "Hi, I'd like to book an Interior Deep Clean.",
      whatsappMessageFr: "Bonjour, je voudrais réserver un nettoyage intérieur profond.",
    },
    {
      id: 3,
      image: beforeAfterExterior,
      titleAr: "غسيل خارجي",
      titleEn: "Exterior Wash",
      titleFr: "Lavage Extérieur",
      ctaAr: "أزل أوساخ أسابيع في غسلة واحدة فاخرة.",
      ctaEn: "Remove weeks of dirt in just one premium wash.",
      ctaFr: "Enlevez des semaines de saleté en un seul lavage premium.",
      whatsappMessageAr: "مرحباً، أريد حجز خدمة الغسيل الخارجي.",
      whatsappMessageEn: "Hi, I'd like to book an Exterior Wash.",
      whatsappMessageFr: "Bonjour, je voudrais réserver un lavage extérieur.",
    },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Opening Offer Modal */}
      <AnimatePresence>
        {showOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeOffer}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-gradient-to-br from-primary via-primary to-chart-1 rounded-2xl p-8 text-white text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeOffer}
                className="absolute top-4 end-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                data-testid="close-offer-modal"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="mb-4">
                <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                  {getLocalizedText("عرض الافتتاح", "Opening Offer", "Offre d'Ouverture")}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold mb-2">15% OFF</h2>
                <p className="text-lg opacity-90">
                  {getLocalizedText(
                    "خصم 15٪ على أول غسلة!",
                    "15% discount on your first wash!",
                    "15% de réduction sur votre premier lavage!"
                  )}
                </p>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="w-full text-lg"
                onClick={() => {
                  closeOffer();
                  document.getElementById("booking-card")?.scrollIntoView({ behavior: "smooth" });
                }}
                data-testid="claim-offer-button"
              >
                {getLocalizedText("احجز الآن بخصم 15%", "Book Now with 15% OFF", "Réserver avec 15% OFF")}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#0a1628]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Luxury car wash"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/70 to-transparent" />
        </div>

        {/* Animated particles/gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-white space-y-6"
            >
              {/* Logo Placeholder */}
              <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-8">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center">
                    <Car className="h-8 w-8 text-white" />
                    <Sparkles className="h-4 w-4 text-white absolute -top-1 -end-1" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-primary">Ghasla</span> <span className="font-normal">Style</span>
                  </h1>
                  <p className="text-sm text-white/70 font-arabic">غسلة ستايل</p>
                </div>
              </motion.div>

              <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {getLocalizedText(
                  "لمعة احترافية عند باب بيتك",
                  "Shiny Car, Happy Journey",
                  "Voiture Brillante, Voyage Heureux"
                )}
              </motion.h2>

              <motion.p variants={fadeInUp} className="text-xl text-white/80 max-w-lg">
                {t("hero.description")}
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4 pt-4">
                <div className="flex items-center gap-2 text-white/70">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>{getLocalizedText("جودة مضمونة", "Quality Guaranteed", "Qualité Garantie")}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{getLocalizedText("خدمة سريعة", "Fast Service", "Service Rapide")}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{getLocalizedText("جميع مناطق الكويت", "All Kuwait Areas", "Tout le Koweït")}</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Booking Card */}
            <motion.div
              id="booking-card"
              initial={{ opacity: 0, y: 50, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative"
            >
              <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-2xl border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    {getLocalizedText("احجز غسلتك الآن", "Book Your Wash Now", "Réservez Maintenant")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Car Type Toggle */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("booking.carType")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["sedan", "suv"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setCarType(type)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            carType === type
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted hover:border-primary/50"
                          }`}
                          data-testid={`car-type-${type}`}
                        >
                          <Car className="h-6 w-6 mx-auto mb-1" />
                          <span className="text-sm font-medium">
                            {type === "sedan" ? t("services.sedan") : t("services.suv")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("booking.step2")}</label>
                    <Select value={service} onValueChange={setService}>
                      <SelectTrigger data-testid="service-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {getLocalizedText(s.nameAr, s.nameEn, s.nameFr)} - {carType === "suv" ? s.suvPrice : s.sedanPrice} {t("services.kd")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Schedule Toggle */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {getLocalizedText("وقت الخدمة", "Service Time", "Heure du Service")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setScheduleType("now")}
                        className={`p-3 rounded-lg border-2 transition-all text-sm ${
                          scheduleType === "now"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted hover:border-primary/50"
                        }`}
                        data-testid="schedule-now"
                      >
                        {getLocalizedText("اغسل الآن", "Wash Now", "Laver Maintenant")}
                      </button>
                      <button
                        onClick={() => setScheduleType("later")}
                        className={`p-3 rounded-lg border-2 transition-all text-sm ${
                          scheduleType === "later"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted hover:border-primary/50"
                        }`}
                        data-testid="schedule-later"
                      >
                        {getLocalizedText("جدول لاحقاً", "Schedule Later", "Planifier")}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Price */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-chart-1/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {getLocalizedText("السعر الإجمالي", "Total Price", "Prix Total")}
                      </span>
                      <span className="text-3xl font-bold text-primary">
                        {currentPrice} <span className="text-lg">{t("services.kd")}</span>
                      </span>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <Link href="/booking" className="block">
                    <Button className="w-full text-lg py-6" size="lg" data-testid="hero-confirm-booking">
                      {t("booking.confirm")}
                    </Button>
                  </Link>

                  {/* WhatsApp Quick Order */}
                  <a
                    href={`https://wa.me/96596068518?text=${encodeURIComponent(
                      getLocalizedText(
                        `مرحباً، أريد حجز ${getLocalizedText(selectedService.nameAr, selectedService.nameEn, selectedService.nameFr)} لسيارة ${carType === "suv" ? "SUV" : "سيدان"}`,
                        `Hi, I want to book ${selectedService.nameEn} for a ${carType} car`,
                        `Bonjour, je veux réserver ${selectedService.nameFr} pour une voiture ${carType}`
                      )
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full bg-[#25D366]/10 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                      data-testid="whatsapp-quick-order"
                    >
                      <SiWhatsapp className="h-5 w-5 me-2" />
                      {getLocalizedText("واتساب - حجز سريع", "WhatsApp – Quick Book", "WhatsApp – Réserver")}
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Pulsing WhatsApp Button near card */}
              <motion.a
                href="https://wa.me/96596068518"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute -bottom-4 start-4 flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-full shadow-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                data-testid="hero-whatsapp-pulse"
              >
                <SiWhatsapp className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {getLocalizedText("حجز سريع", "Quick Book", "Réservation")}
                </span>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Track Your Order Section */}
      <section className="py-16 bg-gradient-to-br from-muted/50 to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {getLocalizedText("تتبع طلبك", "Track Your Order", "Suivre Votre Commande")}
              </h2>
              <p className="text-muted-foreground text-lg">
                تتبع حالة طلب غسلتك خطوة بخطوة برقم الطلب أو من حسابك مباشرة
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder={getLocalizedText("أدخل رقم الطلب", "Enter Order ID", "Entrez le numéro de commande")}
                        value={trackingId}
                        onChange={(e) => {
                          setTrackingId(e.target.value);
                          setTrackingError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleTrackOrder()}
                        className="ps-10"
                        data-testid="input-tracking-id"
                      />
                    </div>
                    <Button 
                      onClick={handleTrackOrder} 
                      disabled={isTracking}
                      className="min-w-[120px]"
                      data-testid="button-track-order"
                    >
                      {isTracking ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        getLocalizedText("تتبع الآن", "Track Now", "Suivre")
                      )}
                    </Button>
                  </div>

                  {/* Error Message */}
                  {trackingError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-sm text-center"
                    >
                      {trackingError}
                    </motion.p>
                  )}

                  {/* Tracked Order Result */}
                  <AnimatePresence>
                    {trackedOrder && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-4 rounded-lg bg-muted/50 border space-y-4">
                          {/* Order Info */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" />
                              <span className="font-medium">
                                {trackedOrder.serviceName 
                                  ? getLocalizedText(
                                      trackedOrder.serviceName.ar,
                                      trackedOrder.serviceName.en,
                                      trackedOrder.serviceName.fr
                                    )
                                  : "Service"}
                              </span>
                            </div>
                            <Badge variant={trackedOrder.status === "completed" ? "default" : trackedOrder.status === "cancelled" ? "destructive" : "secondary"}>
                              {getStatusLabel(trackedOrder.status)}
                            </Badge>
                          </div>

                          {/* Order Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {trackedOrder.carType === "suv" ? "SUV" : getLocalizedText("سيدان", "Sedan", "Berline")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{trackedOrder.area}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{trackedOrder.preferredDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{trackedOrder.preferredTime}</span>
                            </div>
                          </div>

                          {/* Progress Stepper */}
                          {trackedOrder.status !== "cancelled" && (
                            <div className="pt-4">
                              <div className="flex items-center justify-between relative">
                                <div className="absolute top-3 start-0 end-0 h-1 bg-muted rounded-full">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((getStatusStep(trackedOrder.status) / 4) * 100, 100)}%` }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="h-full bg-primary rounded-full"
                                  />
                                </div>
                                {["pending", "assigned", "in_progress", "completed"].map((step, index) => (
                                  <div key={step} className="relative z-10 flex flex-col items-center">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                        getStatusStep(trackedOrder.status) > index
                                          ? "bg-primary text-white"
                                          : "bg-muted border-2 border-muted-foreground/30 text-muted-foreground"
                                      }`}
                                    >
                                      {getStatusStep(trackedOrder.status) > index ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        index + 1
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
                                      {getStatusLabel(step)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* View All Orders Link (for logged-in users) */}
                  {user && (
                    <motion.div variants={fadeIn} className="text-center pt-2">
                      <Link href="/track-order">
                        <Button variant="ghost" className="text-primary underline underline-offset-4" data-testid="link-view-all-orders">
                          {getLocalizedText("عرض جميع طلباتي", "View all my orders", "Voir toutes mes commandes")}
                        </Button>
                      </Link>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              {getLocalizedText("أسطولنا جاهز لخدمتك", "Our Fleet is Ready for Your Wash", "Notre Flotte est Prête")}
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {getLocalizedText(
                "فريقنا المحترف يغطي جميع مناطق الكويت بسيارات مجهزة بأحدث المعدات",
                "Our professional team covers all of Kuwait with fully equipped vehicles",
                "Notre équipe professionnelle couvre tout le Koweït avec des véhicules équipés"
              )}
            </motion.p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-12"
          >
            {fleetStats.map((stat, index) => (
              <motion.div key={index} variants={scaleIn} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">
                  {getLocalizedText(stat.labelAr, stat.labelEn, stat.labelFr)}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Fleet Image */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
          >
            <img
              src={fleetImage}
              alt="Ghasla Style Fleet"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 start-6 end-6 flex items-center justify-between">
              <div className="text-white">
                <p className="text-lg font-semibold">
                  {getLocalizedText("5 سيارات متنقلة", "5 Mobile Vans", "5 Fourgons Mobiles")}
                </p>
                <p className="text-sm text-white/70">
                  {getLocalizedText("فريق من 5 محترفين", "Team of 5 professionals", "Équipe de 5 professionnels")}
                </p>
              </div>
              <Badge className="bg-primary/90">
                <Truck className="h-4 w-4 me-1" />
                {getLocalizedText("تغطية شاملة", "Full Coverage", "Couverture Totale")}
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              {t("services.title")}
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground">
              {t("services.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {serviceCards.map((card, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="h-52 relative overflow-hidden">
                    <img
                      src={card.bgImage}
                      alt={getLocalizedText(card.nameAr, card.nameEn, card.nameFr)}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-lg">
                        <card.icon className="h-10 w-10 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 start-4 end-4">
                      <h3 className="text-xl font-bold text-white drop-shadow-lg">
                        {getLocalizedText(card.nameAr, card.nameEn, card.nameFr)}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      {getLocalizedText(card.descAr, card.descEn, card.descFr)}
                    </p>
                    <ul className="space-y-2">
                      {card.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          {getLocalizedText(feature.ar, feature.en, feature.fr)}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">
                        {getLocalizedText("يبدأ من", "From", "À partir de")}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {card.price} {t("services.kd")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/booking" className="flex-1">
                        <Button className="w-full" data-testid={`book-service-${index}`}>
                          {t("hero.bookNow")}
                        </Button>
                      </Link>
                      <a
                        href="https://wa.me/96596068518"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="icon" className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white">
                          <SiWhatsapp className="h-5 w-5" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mt-10"
          >
            <Link href="/services">
              <Button variant="outline" size="lg">
                {getLocalizedText("عرض جميع الخدمات", "View All Services", "Voir Tous les Services")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Before & After Section */}
      <section className="py-20 bg-gradient-to-br from-[#0a1628] to-[#0f2744] text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              {getLocalizedText("نتائج قبل وبعد", "Before & After Results", "Résultats Avant & Après")}
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-white/70 max-w-2xl mx-auto">
              {getLocalizedText(
                "شاهد الفرق الذي نصنعه - نتائج حقيقية من عملائنا السعداء",
                "See the difference we make - real results from our happy customers",
                "Voyez la différence que nous faisons - résultats réels de nos clients satisfaits"
              )}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {beforeAfterComparisons.map((comparison, index) => (
              <motion.div
                key={comparison.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
                className="group"
              >
                <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black/30 backdrop-blur-sm border border-white/10 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] group-hover:border-primary/30">
                  <div className="relative aspect-video overflow-hidden select-none">
                    <img
                      src={comparison.image}
                      alt={comparison.titleEn}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      draggable={false}
                    />
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent transition-opacity duration-300 group-hover:opacity-80"
                      style={{ 
                        clipPath: `inset(0 ${100 - sliderPositions[comparison.id]}% 0 0)` 
                      }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      style={{ left: `${sliderPositions[comparison.id]}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                          <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPositions[comparison.id]}
                      onChange={(e) => handleSliderChange(comparison.id, parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                      data-testid={`slider-before-after-${comparison.id}`}
                    />
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.15 }}
                      className="absolute top-3 left-3 z-10"
                    >
                      <Badge className="bg-gray-600/90 text-white shadow-lg backdrop-blur-sm px-3 py-1">
                        {getLocalizedText("قبل", "Before", "Avant")}
                      </Badge>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.15 }}
                      className="absolute top-3 right-3 z-10"
                    >
                      <Badge className="bg-primary text-primary-foreground shadow-lg backdrop-blur-sm px-3 py-1">
                        {getLocalizedText("بعد", "After", "Après")}
                      </Badge>
                    </motion.div>
                  </div>
                  <div className="p-5 text-center space-y-3">
                    <h3 className="text-xl font-bold">
                      {getLocalizedText(comparison.titleAr, comparison.titleEn, comparison.titleFr)}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {getLocalizedText(comparison.ctaAr, comparison.ctaEn, comparison.ctaFr)}
                    </p>
                    <a
                      href={`https://wa.me/96596068518?text=${encodeURIComponent(getLocalizedText(comparison.whatsappMessageAr, comparison.whatsappMessageEn, comparison.whatsappMessageFr))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button 
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[0_0_20px_rgba(37,211,102,0.4)]"
                        data-testid={`whatsapp-order-${comparison.id}`}
                      >
                        <SiWhatsapp className="h-5 w-5 me-2" />
                        {getLocalizedText("اطلب عبر واتساب", "Order on WhatsApp", "Commander sur WhatsApp")}
                      </Button>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Map Section */}
      <section className="relative h-[500px]">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d446529.73695167716!2d47.48265545!3d29.31166095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3fc5363fbeea51a1%3A0x74726bcd92d8edd2!2sKuwait!5e0!3m2!1sen!2sus!4v1703000000000!5m2!1sen!2sus"
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ghasla Style Coverage Area"
        />
        
        {/* Floating Contact Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, type: "spring", bounce: 0.3 }}
          className="absolute bottom-8 start-8 max-w-xs"
        >
          <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">
                    {getLocalizedText(
                      "تحتاج مساعدة؟",
                      "Need help?",
                      "Besoin d'aide?"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getLocalizedText(
                      "أرسل موقعك عبر واتساب",
                      "Send us your location on WhatsApp",
                      "Envoyez-nous votre position sur WhatsApp"
                    )}
                  </p>
                  <a href="https://wa.me/96596068518" target="_blank" rel="noopener noreferrer">
                    <Button className="bg-[#25D366] hover:bg-[#128C7E] w-full" data-testid="map-whatsapp-button">
                      <SiWhatsapp className="h-4 w-4 me-2" />
                      {getLocalizedText("تواصل الآن", "Chat Now", "Discuter")}
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Loyalty & Friends Club Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Loyalty Program */}
            <motion.div variants={slideInLeft}>
              <Card className="h-full overflow-hidden">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
                  <Star className="h-12 w-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{t("loyalty.title")}</h3>
                  <p className="opacity-90">{t("loyalty.subtitle")}</p>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">35</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocalizedText("نقطة/دينار", "pts/KD", "pts/KD")}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">100</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocalizedText("= 0.4 د.ك", "= 0.4 KD", "= 0.4 KD")}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">200</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocalizedText("مكافأة ترحيب", "Welcome", "Bienvenue")}
                      </div>
                    </div>
                  </div>
                  <Link href="/loyalty">
                    <Button className="w-full" data-testid="learn-loyalty-home">
                      {t("hero.learnMore")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Friends Club */}
            <motion.div variants={slideInRight}>
              <Card className="h-full overflow-hidden">
                <div className="bg-gradient-to-br from-chart-1 to-chart-1/80 p-8 text-white">
                  <Users className="h-12 w-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{t("friendsClub.title")}</h3>
                  <p className="opacity-90">{t("friendsClub.subtitle")}</p>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-chart-1">400</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocalizedText("للمُحيل", "Referrer", "Parrain")}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-chart-1">200</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocalizedText("للصديق", "Friend", "Ami")}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-chart-1">∞</div>
                      <div className="text-xs text-muted-foreground">
                        {getLocalizedText("بلا حدود", "Unlimited", "Illimité")}
                      </div>
                    </div>
                  </div>
                  <Link href="/friends-club">
                    <Button variant="outline" className="w-full border-chart-1 text-chart-1 hover:bg-chart-1/10" data-testid="learn-friends-home">
                      {t("hero.learnMore")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-chart-1 text-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto px-4 text-center"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
            {getLocalizedText(
              "جاهز لتجربة أفضل غسيل سيارات؟",
              "Ready for the Best Car Wash?",
              "Prêt pour le Meilleur Lavage?"
            )}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            {getLocalizedText(
              "احجز الآن واستمتع بخدمة متميزة ونظام مكافآت حصري",
              "Book now and enjoy premium service with exclusive rewards",
              "Réservez maintenant et profitez d'un service premium"
            )}
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/booking">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="cta-book-final">
                {t("hero.bookNow")}
              </Button>
            </Link>
            <a href="https://wa.me/96596068518" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">
                <SiWhatsapp className="h-5 w-5 me-2" />
                {t("contact.whatsapp")}
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
