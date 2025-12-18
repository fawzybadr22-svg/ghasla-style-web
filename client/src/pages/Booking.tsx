import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Car, Sparkles, MapPin, CreditCard, Check, ChevronRight, ChevronLeft, Loader2, Navigation, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { ServicePackage } from "@shared/schema";

const defaultPackages: ServicePackage[] = [
  { id: "1", nameAr: "غسيل خارجي", nameEn: "Exterior Wash", nameFr: "Lavage Extérieur", descriptionAr: "", descriptionEn: "", descriptionFr: "", priceSedanKD: 3, priceSuvKD: 4, estimatedMinutes: 30, category: "exterior", isActive: true, createdAt: new Date() },
  { id: "2", nameAr: "تنظيف داخلي", nameEn: "Interior Clean", nameFr: "Nettoyage Intérieur", descriptionAr: "", descriptionEn: "", descriptionFr: "", priceSedanKD: 5, priceSuvKD: 7, estimatedMinutes: 45, category: "interior", isActive: true, createdAt: new Date() },
  { id: "3", nameAr: "غسيل كامل", nameEn: "Full Wash", nameFr: "Lavage Complet", descriptionAr: "", descriptionEn: "", descriptionFr: "", priceSedanKD: 7, priceSuvKD: 10, estimatedMinutes: 60, category: "full", isActive: true, createdAt: new Date() },
  { id: "4", nameAr: "VIP / تفصيلي", nameEn: "VIP / Detailing", nameFr: "VIP / Détaillage", descriptionAr: "", descriptionEn: "", descriptionFr: "", priceSedanKD: 15, priceSuvKD: 20, estimatedMinutes: 120, category: "vip", isActive: true, createdAt: new Date() },
];


export default function Booking() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const preselectedPackage = new URLSearchParams(search).get("package");
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [formData, setFormData] = useState({
    carType: "sedan" as "sedan" | "suv" | "other",
    carDetails: "",
    packageId: preselectedPackage || "",
    address: "",
    area: "",
    date: "",
    time: "",
    paymentMethod: "cash" as "cash" | "online",
    pointsToRedeem: 0,
  });

  const { data: packages } = useQuery<ServicePackage[]>({
    queryKey: ["/api/packages"],
  });

  const { data: areas } = useQuery<string[]>({
    queryKey: ["/api/areas"],
  });

  const { data: loyaltyConfigData } = useQuery<{
    conversionRate: number;
    maxRedeemPercentage: number;
    pointsPerKD: number;
  }>({
    queryKey: ["/api/loyalty/config"],
  });

  const displayPackages = packages?.length ? packages : defaultPackages;
  const displayAreas = areas || ["Capital", "Hawalli", "Farwaniya", "Ahmadi", "Jahra", "Mubarak Al-Kabeer"];
  const selectedPackage = displayPackages.find(p => p.id === formData.packageId);
  const basePrice = selectedPackage ? (formData.carType === "suv" ? selectedPackage.priceSuvKD : selectedPackage.priceSedanKD) : 0;
  
  const loyaltyConfig = loyaltyConfigData || { conversionRate: 0.004, maxRedeemPercentage: 0.15 };
  const maxRedeemPoints = user?.loyaltyPoints || 0;
  const maxRedeemValue = basePrice * loyaltyConfig.maxRedeemPercentage;
  const maxAllowedPoints = Math.min(maxRedeemPoints, maxRedeemValue / loyaltyConfig.conversionRate);
  const discount = formData.pointsToRedeem * loyaltyConfig.conversionRate;
  const finalPrice = Math.max(0, basePrice - discount);

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: getLocalizedText("خطأ", "Error", "Erreur"),
        description: getLocalizedText(
          "المتصفح لا يدعم تحديد الموقع",
          "Browser doesn't support geolocation",
          "Le navigateur ne prend pas en charge la géolocalisation"
        ),
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${i18n.language}`
        );
        const data = await response.json();
        
        if (data.display_name) {
          setFormData(prev => ({
            ...prev,
            address: data.display_name.split(",").slice(0, 3).join(","),
          }));
          setLocationDetected(true);
          toast({
            title: getLocalizedText("تم تحديد الموقع", "Location Detected", "Emplacement Détecté"),
            description: getLocalizedText(
              "تم تحديد موقعك تلقائياً",
              "Your location was detected automatically",
              "Votre emplacement a été détecté automatiquement"
            ),
          });
        }
      } catch {
        setFormData(prev => ({
          ...prev,
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        setLocationDetected(true);
      }
    } catch (error: any) {
      let message = getLocalizedText(
        "فشل تحديد الموقع",
        "Failed to get location",
        "Échec de la géolocalisation"
      );
      if (error.code === 1) {
        message = getLocalizedText(
          "تم رفض إذن الموقع",
          "Location permission denied",
          "Permission de localisation refusée"
        );
      }
      toast({
        title: getLocalizedText("خطأ", "Error", "Erreur"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLocating(false);
    }
  };

  const getMinTime = () => {
    const now = new Date();
    if (formData.date === now.toISOString().split("T")[0]) {
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "06:00";
  };

  const steps = [
    { number: 1, label: t("booking.step1"), icon: Car },
    { number: 2, label: t("booking.step2"), icon: Sparkles },
    { number: 3, label: t("booking.step3"), icon: MapPin },
    { number: 4, label: t("booking.step4"), icon: CreditCard },
  ];

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: t("common.error"),
        description: getLocalizedText("يرجى تسجيل الدخول أولاً", "Please login first", "Veuillez d'abord vous connecter"),
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user.id,
          carType: formData.carType,
          carDetails: formData.carDetails,
          servicePackageId: formData.packageId,
          address: formData.address,
          area: formData.area,
          preferredDate: formData.date,
          preferredTime: formData.time,
          paymentMethod: formData.paymentMethod,
          priceKD: 0,
          loyaltyPointsRedeemed: formData.pointsToRedeem,
          status: "pending",
        }),
      });

      if (response.ok) {
        const order = await response.json();
        toast({
          title: t("booking.success"),
          description: `${t("booking.orderNumber")}: ${order.id}`,
        });
        setLocation("/account");
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: getLocalizedText("حاول مرة أخرى", "Please try again", "Veuillez réessayer"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.carType;
      case 2: return formData.packageId;
      case 3: return formData.address && formData.area && formData.date && formData.time;
      case 4: return formData.paymentMethod;
      default: return false;
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("booking.title")}</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.number ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 md:w-20 h-1 mx-2 ${step > s.number ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[step - 1].label}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Car Type */}
            {step === 1 && (
              <div className="space-y-6">
                <RadioGroup
                  value={formData.carType}
                  onValueChange={(value) => setFormData({ ...formData, carType: value as any })}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {["sedan", "suv", "other"].map((type) => (
                    <Label
                      key={type}
                      className={`flex flex-col items-center p-6 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.carType === type ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={type} className="sr-only" />
                      <Car className="h-12 w-12 mb-3 text-primary" />
                      <span className="font-medium">
                        {type === "sedan" ? t("services.sedan") : type === "suv" ? t("services.suv") : getLocalizedText("أخرى", "Other", "Autre")}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>

                <div className="space-y-2">
                  <Label>{t("booking.carDetails")}</Label>
                  <Input
                    value={formData.carDetails}
                    onChange={(e) => setFormData({ ...formData, carDetails: e.target.value })}
                    placeholder={getLocalizedText("مثال: تويوتا كامري أبيض", "e.g., Toyota Camry White", "ex: Toyota Camry Blanche")}
                    data-testid="input-car-details"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Select Package */}
            {step === 2 && (
              <RadioGroup
                value={formData.packageId}
                onValueChange={(value) => setFormData({ ...formData, packageId: value })}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {displayPackages.filter(p => p.isActive).map((pkg) => (
                  <Label
                    key={pkg.id}
                    className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.packageId === pkg.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={pkg.id} className="sr-only" />
                    <span className="font-semibold mb-1">
                      {getLocalizedText(pkg.nameAr, pkg.nameEn, pkg.nameFr)}
                    </span>
                    <span className="text-primary font-bold">
                      {formData.carType === "suv" ? pkg.priceSuvKD : pkg.priceSedanKD} {t("services.kd")}
                    </span>
                    <span className="text-sm text-muted-foreground mt-1">
                      {pkg.estimatedMinutes} {t("services.minutes")}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {/* Step 3: Location & Time */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {getLocalizedText("المنطقة", "Area", "Zone")}
                  </Label>
                  <Select
                    value={formData.area}
                    onValueChange={(value) => setFormData({ ...formData, area: value })}
                  >
                    <SelectTrigger data-testid="select-area">
                      <SelectValue placeholder={getLocalizedText("اختر المنطقة", "Select area", "Sélectionner la zone")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {displayAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    {getLocalizedText("العنوان التفصيلي", "Detailed Address", "Adresse Détaillée")}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={formData.address}
                        onChange={(e) => {
                          setFormData({ ...formData, address: e.target.value });
                          setLocationDetected(false);
                        }}
                        placeholder={getLocalizedText("أدخل العنوان أو اضغط على زر الموقع", "Enter address or click location button", "Entrez l'adresse ou cliquez sur le bouton de localisation")}
                        required
                        data-testid="input-address"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      data-testid="button-get-location"
                      title={getLocalizedText("تحديد الموقع تلقائياً", "Auto-detect location", "Détecter l'emplacement")}
                    >
                      {isLocating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {locationDetected && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {getLocalizedText("تم تحديد موقعك تلقائياً", "Location detected automatically", "Emplacement détecté automatiquement")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {getLocalizedText("التاريخ", "Date", "Date")}
                    </Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value, time: "" })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="cursor-pointer"
                      data-testid="input-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {getLocalizedText("الوقت", "Time", "Heure")}
                    </Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      min={getMinTime()}
                      max="22:00"
                      required
                      className="cursor-pointer"
                      data-testid="input-time"
                    />
                    <p className="text-xs text-muted-foreground">
                      {getLocalizedText("من 6 صباحاً إلى 10 مساءً", "6:00 AM to 10:00 PM", "De 6h00 à 22h00")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div className="space-y-6">
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as any })}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Label
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="cash" className="sr-only" />
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-2xl">💵</span>
                    </div>
                    <span className="font-medium">{t("booking.cash")}</span>
                  </Label>
                  <Label
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.paymentMethod === "online" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="online" className="sr-only" />
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="font-medium">{t("booking.online")}</span>
                  </Label>
                </RadioGroup>

                {user && user.loyaltyPoints > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t("booking.redeemPoints")}</span>
                      <span className="text-sm text-muted-foreground">
                        {t("booking.availablePoints")}: {user.loyaltyPoints}
                      </span>
                    </div>
                    <Slider
                      value={[formData.pointsToRedeem]}
                      onValueChange={([value]) => setFormData({ ...formData, pointsToRedeem: value })}
                      max={maxAllowedPoints}
                      step={10}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span>{t("booking.pointsToRedeem")}: {formData.pointsToRedeem}</span>
                      <span className="text-primary font-medium">
                        {t("booking.discount")}: {discount.toFixed(3)} {t("services.kd")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="p-4 rounded-lg bg-card border space-y-2">
                  <h4 className="font-semibold mb-3">
                    {getLocalizedText("ملخص الطلب", "Order Summary", "Résumé de la Commande")}
                  </h4>
                  {selectedPackage && (
                    <>
                      <div className="flex justify-between">
                        <span>{getLocalizedText(selectedPackage.nameAr, selectedPackage.nameEn, selectedPackage.nameFr)}</span>
                        <span>{basePrice} {t("services.kd")}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>{t("booking.discount")}</span>
                          <span>-{discount.toFixed(3)} {t("services.kd")}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>{t("booking.total")}</span>
                        <span className="text-primary">{finalPrice.toFixed(3)} {t("services.kd")}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            data-testid="button-back"
          >
            {i18n.language === "ar" ? <ChevronRight className="h-4 w-4 me-2" /> : <ChevronLeft className="h-4 w-4 me-2" />}
            {t("booking.back")}
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              data-testid="button-next"
            >
              {t("booking.next")}
              {i18n.language === "ar" ? <ChevronLeft className="h-4 w-4 ms-2" /> : <ChevronRight className="h-4 w-4 ms-2" />}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              data-testid="button-confirm"
            >
              {isSubmitting ? t("common.loading") : t("booking.confirm")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
