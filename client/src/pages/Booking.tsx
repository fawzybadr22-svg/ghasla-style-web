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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { ServicePackage, ServiceArea } from "@shared/schema";

const defaultPackages: ServicePackage[] = [
  { id: "1", nameAr: "غسيل خارجي", nameEn: "Exterior Wash", nameFr: "Lavage Extérieur", descriptionAr: "", descriptionEn: "", descriptionFr: "", priceSedanKD: 3.5, priceSuvKD: 4.5, estimatedMinutes: 30, category: "exterior", isActive: true, createdAt: new Date() },
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
  const [fieldErrors, setFieldErrors] = useState<{
    area?: string;
    address?: string;
    date?: string;
    time?: string;
  }>({});
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

  const { data: areasData, isLoading: areasLoading } = useQuery<ServiceArea[]>({
    queryKey: ["/api/areas"],
  });
  
  // Default fallback areas in case API fails
  const defaultAvailableAreas: ServiceArea[] = [
    { nameAr: "السالمية", nameEn: "Salmiya", nameFr: "Salmiya", isAvailable: true },
    { nameAr: "الروضة", nameEn: "Rawda", nameFr: "Rawda", isAvailable: true },
    { nameAr: "السرة", nameEn: "Surra", nameFr: "Surra", isAvailable: true },
  ];
  const defaultComingSoonAreas: ServiceArea[] = [
    { nameAr: "حولي", nameEn: "Hawalli", nameFr: "Hawalli", isAvailable: false },
    { nameAr: "الفروانية", nameEn: "Farwaniya", nameFr: "Farwaniya", isAvailable: false },
  ];
  
  // Separate available and coming soon areas
  const availableAreas = areasData?.filter(a => a.isAvailable) || defaultAvailableAreas;
  const comingSoonAreas = areasData?.filter(a => !a.isAvailable) || defaultComingSoonAreas;

  const { data: loyaltyConfigData } = useQuery<{
    conversionRate: number;
    maxRedeemPercentage: number;
    pointsPerKD: number;
  }>({
    queryKey: ["/api/loyalty/config"],
  });

  const displayPackages = packages?.length ? packages : defaultPackages;
  
  // Check if selected area is available now
  const selectedAreaData = areasData?.find(a => a.nameEn === formData.area);
  const isAreaAvailable = selectedAreaData?.isAvailable ?? true;
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

  // Helper function to get address from coordinates using backend proxy
  const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lon}&lang=${i18n.language}`
      );
      const data = await response.json();
      if (data.display_name) {
        return data.display_name.split(",").slice(0, 3).join(",");
      }
      return null;
    } catch {
      return null;
    }
  };

  // Try IP-based location as fallback
  const getIPLocation = async (): Promise<{ lat: number; lon: number; city: string } | null> => {
    try {
      const response = await fetch("/api/geocode/ip-location");
      const data = await response.json();
      if (data.success) {
        return { lat: data.lat, lon: data.lon, city: data.city };
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    
    // First try browser geolocation
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          });
        });

        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        
        if (address) {
          setFormData(prev => ({ ...prev, address }));
        } else {
          setFormData(prev => ({ ...prev, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        }
        setLocationDetected(true);
        toast({
          title: getLocalizedText("تم تحديد الموقع", "Location Detected", "Emplacement Détecté"),
          description: getLocalizedText(
            "تم تحديد موقعك تلقائياً",
            "Your location was detected automatically",
            "Votre emplacement a été détecté automatiquement"
          ),
        });
        setIsLocating(false);
        return;
      } catch (geoError: any) {
        console.log("Browser geolocation failed, trying IP-based fallback...", geoError.code);
      }
    }
    
    // Fallback to IP-based location
    try {
      const ipLocation = await getIPLocation();
      if (ipLocation) {
        const address = await reverseGeocode(ipLocation.lat, ipLocation.lon);
        if (address) {
          setFormData(prev => ({ ...prev, address }));
          setLocationDetected(true);
          toast({
            title: getLocalizedText("تم تحديد الموقع التقريبي", "Approximate Location", "Emplacement Approximatif"),
            description: getLocalizedText(
              `تم تحديد موقعك التقريبي: ${ipLocation.city}. يرجى تعديل العنوان إذا لزم الأمر`,
              `Approximate location: ${ipLocation.city}. Please adjust if needed`,
              `Emplacement approximatif: ${ipLocation.city}. Veuillez ajuster si nécessaire`
            ),
          });
          setIsLocating(false);
          return;
        }
      }
    } catch {
      console.log("IP-based location also failed");
    }
    
    // All methods failed
    toast({
      title: getLocalizedText("تنبيه", "Notice", "Avis"),
      description: getLocalizedText(
        "لم نتمكن من تحديد موقعك. يرجى إدخال العنوان يدوياً",
        "Could not detect your location. Please enter address manually",
        "Impossible de détecter votre emplacement. Veuillez saisir l'adresse manuellement"
      ),
    });
    setIsLocating(false);
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
          carDetails: formData.carDetails || null,
          servicePackageId: formData.packageId,
          address: formData.address,
          area: formData.area,
          preferredDate: formData.date,
          preferredTime: formData.time,
          paymentMethod: formData.paymentMethod,
          priceKD: finalPrice,
          loyaltyPointsRedeemed: formData.pointsToRedeem,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // If online payment, create payment and redirect to checkout
        if (formData.paymentMethod === "online") {
          try {
            const paymentResponse = await fetch("/api/payments/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.id,
                customerId: user.id,
                amountKD: finalPrice,
                customerEmail: user.email,
                customerPhone: user.phone,
              }),
            });
            
            const paymentData = await paymentResponse.json();
            
            if (paymentResponse.ok && paymentData.paymentId) {
              setFormData({
                carType: "sedan",
                carDetails: "",
                packageId: "",
                address: "",
                area: "",
                date: "",
                time: "",
                paymentMethod: "cash",
                pointsToRedeem: 0,
              });
              setStep(1);
              setLocation(`/payment/checkout/${paymentData.paymentId}`);
              return;
            } else {
              // Payment creation failed - fallback to cash and continue
              toast({
                title: getLocalizedText("تنبيه", "Notice", "Avis"),
                description: getLocalizedText(
                  "فشل إنشاء عملية الدفع. سيتم التعامل مع طلبك كدفع نقدي.",
                  "Failed to create payment. Your order will be processed as cash payment.",
                  "Échec de la création du paiement. Votre commande sera traitée en espèces."
                ),
              });
              // Update order to cash payment as fallback
              await fetch(`/api/orders/${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod: "cash" }),
              });
              // Continue to success flow with cash payment
            }
          } catch (paymentError) {
            console.error("Payment creation failed:", paymentError);
            toast({
              title: getLocalizedText("تنبيه", "Notice", "Avis"),
              description: getLocalizedText(
                "حدث خطأ في الاتصال. سيتم التعامل مع طلبك كدفع نقدي.",
                "Connection error. Your order will be processed as cash payment.",
                "Erreur de connexion. Votre commande sera traitée en espèces."
              ),
            });
            // Update order to cash payment as fallback
            try {
              await fetch(`/api/orders/${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod: "cash" }),
              });
            } catch {}
            // Continue to success flow with cash payment
          }
        }
        
        toast({
          title: t("booking.success"),
          description: `${t("booking.orderNumber")}: ${data.id}`,
        });
        setFormData({
          carType: "sedan",
          carDetails: "",
          packageId: "",
          address: "",
          area: "",
          date: "",
          time: "",
          paymentMethod: "cash",
          pointsToRedeem: 0,
        });
        setStep(1);
        setLocation("/account");
      } else {
        // Use localized error message if available
        const errorMessage = data.errorAr && i18n.language === "ar" 
          ? data.errorAr 
          : data.errorFr && i18n.language === "fr"
            ? data.errorFr
            : data.error || getLocalizedText("فشل إنشاء الحجز", "Failed to create booking", "Échec de la création de la réservation");
        
        toast({
          title: t("common.error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: getLocalizedText("حدث خطأ في الاتصال. حاول مرة أخرى", "Connection error. Please try again", "Erreur de connexion. Veuillez réessayer"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep3 = (): boolean => {
    const errors: typeof fieldErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.area) {
      errors.area = getLocalizedText("برجاء اختيار المنطقة", "Please select an area", "Veuillez sélectionner une zone");
    }

    if (!formData.address.trim()) {
      errors.address = getLocalizedText("برجاء إدخال العنوان التفصيلي", "Please enter a detailed address", "Veuillez entrer une adresse détaillée");
    }

    if (!formData.date) {
      errors.date = getLocalizedText("برجاء اختيار التاريخ", "Please select a date", "Veuillez sélectionner une date");
    } else {
      const selectedDate = new Date(formData.date);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.date = getLocalizedText("التاريخ يجب أن يكون اليوم أو في المستقبل", "Date must be today or in the future", "La date doit être aujourd'hui ou dans le futur");
      }
    }

    if (!formData.time) {
      errors.time = getLocalizedText("برجاء اختيار الوقت", "Please select a time", "Veuillez sélectionner une heure");
    } else {
      const [hours, minutes] = formData.time.split(":").map(Number);
      if (hours < 6 || hours > 22 || (hours === 22 && minutes > 0)) {
        errors.time = getLocalizedText("الوقت يجب أن يكون بين 6 صباحاً و 10 مساءً", "Time must be between 6:00 AM and 10:00 PM", "L'heure doit être entre 6h00 et 22h00");
      }
      
      if (formData.date === today.toISOString().split("T")[0]) {
        const now = new Date();
        const selectedTime = new Date();
        selectedTime.setHours(hours, minutes, 0, 0);
        if (selectedTime <= now) {
          errors.time = getLocalizedText("الوقت يجب أن يكون في المستقبل", "Time must be in the future", "L'heure doit être dans le futur");
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 3) {
      if (validateStep3()) {
        setFieldErrors({});
        setStep(step + 1);
      }
    } else {
      setStep(step + 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.carType;
      case 2: return formData.packageId;
      case 3: return formData.address.trim() && formData.area && formData.date && formData.time;
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
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.area}
                    onValueChange={(value) => {
                      setFormData({ ...formData, area: value });
                      if (fieldErrors.area) setFieldErrors(prev => ({ ...prev, area: undefined }));
                    }}
                  >
                    <SelectTrigger data-testid="select-area" className={fieldErrors.area ? "border-destructive" : ""}>
                      <SelectValue placeholder={getLocalizedText("اختر المنطقة", "Select area", "Sélectionner la zone")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectGroup>
                        <SelectLabel className="text-green-600 font-semibold">
                          {getLocalizedText("متاحة الآن", "Available Now", "Disponible maintenant")}
                        </SelectLabel>
                        {availableAreas.map((area) => (
                          <SelectItem key={area.nameEn} value={area.nameEn} data-testid={`area-available-${area.nameEn}`}>
                            <span className="flex items-center gap-2">
                              <Check className="h-3 w-3 text-green-600" />
                              {getLocalizedText(area.nameAr, area.nameEn, area.nameFr)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-orange-500 font-semibold">
                          {getLocalizedText("متاحة قريباً", "Available Soon", "Bientôt disponible")}
                        </SelectLabel>
                        {comingSoonAreas.map((area) => (
                          <SelectItem key={area.nameEn} value={area.nameEn} data-testid={`area-soon-${area.nameEn}`}>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3 w-3 text-orange-500" />
                              {getLocalizedText(area.nameAr, area.nameEn, area.nameFr)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldErrors.area && (
                    <p className="text-sm text-destructive">{fieldErrors.area}</p>
                  )}
                  {formData.area && !isAreaAvailable && (
                    <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {getLocalizedText(
                          "الخدمة متاحة قريباً في هذه المنطقة. سجل طلبك وسنشعرك فور تغطية منطقتك.",
                          "Service coming soon to this area. Register your request and we'll notify you when coverage begins.",
                          "Service bientôt disponible dans cette zone. Inscrivez-vous et nous vous informerons dès le début de la couverture."
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    {getLocalizedText("العنوان التفصيلي", "Detailed Address", "Adresse Détaillée")}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={formData.address}
                        onChange={(e) => {
                          setFormData({ ...formData, address: e.target.value });
                          setLocationDetected(false);
                          if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: undefined }));
                        }}
                        placeholder={getLocalizedText("أدخل العنوان أو اضغط على زر الموقع", "Enter address or click location button", "Entrez l'adresse ou cliquez sur le bouton de localisation")}
                        className={fieldErrors.address ? "border-destructive" : ""}
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
                      title={getLocalizedText("تحديد الموقع تلقائياً (اختياري)", "Auto-detect location (optional)", "Détecter l'emplacement (optionnel)")}
                    >
                      {isLocating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {fieldErrors.address && (
                    <p className="text-sm text-destructive">{fieldErrors.address}</p>
                  )}
                  {locationDetected && !fieldErrors.address && (
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
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => {
                        setFormData({ ...formData, date: e.target.value, time: "" });
                        if (fieldErrors.date) setFieldErrors(prev => ({ ...prev, date: undefined }));
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      className={`cursor-pointer ${fieldErrors.date ? "border-destructive" : ""}`}
                      data-testid="input-date"
                    />
                    {fieldErrors.date && (
                      <p className="text-sm text-destructive">{fieldErrors.date}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {getLocalizedText("الوقت", "Time", "Heure")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => {
                        setFormData({ ...formData, time: e.target.value });
                        if (fieldErrors.time) setFieldErrors(prev => ({ ...prev, time: undefined }));
                      }}
                      min={getMinTime()}
                      max="22:00"
                      className={`cursor-pointer ${fieldErrors.time ? "border-destructive" : ""}`}
                      data-testid="input-time"
                    />
                    {fieldErrors.time ? (
                      <p className="text-sm text-destructive">{fieldErrors.time}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {getLocalizedText("من 6 صباحاً إلى 10 مساءً", "6:00 AM to 10:00 PM", "De 6h00 à 22h00")}
                      </p>
                    )}
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
              onClick={handleNextStep}
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
