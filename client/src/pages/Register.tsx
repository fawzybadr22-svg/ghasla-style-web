import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { Mail, Lock, User, Phone, Gift, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const referralCodeFromUrl = new URLSearchParams(search).get("ref") || "";
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+965 ",
    password: "",
    confirmPassword: "",
    referralCode: referralCodeFromUrl,
  });

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasMinLength && hasNumberOrSymbol;
  };

  const validatePhone = (phone: string) => {
    const phoneClean = phone.replace(/\s/g, "");
    const kuwaitPhoneRegex = /^\+965[569]\d{7}$/;
    return !phone || phone === "+965 " || kuwaitPhoneRegex.test(phoneClean);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = getLocalizedText("الاسم مطلوب", "Name is required", "Le nom est requis");
    }

    if (!formData.email.trim()) {
      newErrors.email = getLocalizedText("البريد الإلكتروني مطلوب", "Email is required", "L'email est requis");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = getLocalizedText("البريد الإلكتروني غير صحيح", "Invalid email format", "Format d'email invalide");
    }

    if (!formData.password) {
      newErrors.password = getLocalizedText("كلمة المرور مطلوبة", "Password is required", "Le mot de passe est requis");
    } else if (!validatePassword(formData.password)) {
      newErrors.password = getLocalizedText(
        "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على رقم أو رمز",
        "Password must be at least 8 characters with a number or symbol",
        "Le mot de passe doit contenir au moins 8 caractères avec un chiffre ou symbole"
      );
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = getLocalizedText(
        "كلمتا المرور غير متطابقتين",
        "Passwords do not match",
        "Les mots de passe ne correspondent pas"
      );
    }

    if (formData.phone && formData.phone !== "+965 " && !validatePhone(formData.phone)) {
      newErrors.phone = getLocalizedText(
        "رقم الهاتف غير صحيح (مثال: +965 9XXX XXXX)",
        "Invalid phone number (example: +965 9XXX XXXX)",
        "Numéro de téléphone invalide (exemple: +965 9XXX XXXX)"
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return getLocalizedText(
          "هذا البريد الإلكتروني مستخدم بالفعل",
          "This email is already in use",
          "Cet email est déjà utilisé"
        );
      case "auth/invalid-email":
        return getLocalizedText(
          "البريد الإلكتروني غير صحيح",
          "Invalid email address",
          "Adresse email invalide"
        );
      case "auth/weak-password":
        return getLocalizedText(
          "كلمة المرور ضعيفة جداً",
          "Password is too weak",
          "Le mot de passe est trop faible"
        );
      case "auth/operation-not-allowed":
        return getLocalizedText(
          "تسجيل الحساب غير متاح حالياً",
          "Account registration is not available",
          "L'inscription n'est pas disponible"
        );
      case "auth/network-request-failed":
        return getLocalizedText(
          "خطأ في الاتصال بالشبكة",
          "Network connection error",
          "Erreur de connexion réseau"
        );
      default:
        return getLocalizedText(
          "حدث خطأ أثناء إنشاء الحساب",
          "An error occurred during registration",
          "Une erreur s'est produite lors de l'inscription"
        );
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const phone = formData.phone === "+965 " ? undefined : formData.phone.replace(/\s/g, "");
      await registerWithEmail(
        formData.email,
        formData.password,
        formData.name,
        phone,
        formData.referralCode || undefined
      );
      toast({
        title: getLocalizedText("تم إنشاء الحساب بنجاح", "Account Created Successfully", "Compte Créé avec Succès"),
        description: getLocalizedText(
          "مرحباً بك في غسلة ستايل!",
          "Welcome to Ghasla Style!",
          "Bienvenue chez Ghasla Style!"
        ),
      });
      setLocation("/account");
    } catch (error: any) {
      const errorCode = error.code || "";
      toast({
        title: getLocalizedText("خطأ", "Error", "Erreur"),
        description: getFirebaseErrorMessage(errorCode),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      toast({
        title: getLocalizedText("تم تسجيل الدخول بنجاح", "Login Successful", "Connexion Réussie"),
        description: getLocalizedText(
          "مرحباً بك في غسلة ستايل!",
          "Welcome to Ghasla Style!",
          "Bienvenue chez Ghasla Style!"
        ),
      });
      setLocation("/account");
    } catch (error: any) {
      const errorCode = error.code || "";
      let message = getLocalizedText(
        "فشل تسجيل الدخول بواسطة Google",
        "Google login failed",
        "Échec de la connexion Google"
      );
      if (errorCode === "auth/popup-closed-by-user") {
        message = getLocalizedText(
          "تم إلغاء تسجيل الدخول",
          "Login was cancelled",
          "Connexion annulée"
        );
      }
      toast({
        title: getLocalizedText("خطأ", "Error", "Erreur"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {getLocalizedText("إنشاء حساب جديد", "Create New Account", "Créer un Nouveau Compte")}
            </CardTitle>
            <CardDescription>
              {getLocalizedText(
                "أنشئ حسابك للاستمتاع بجميع المزايا",
                "Create your account to enjoy all benefits",
                "Créez votre compte pour profiter de tous les avantages"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              data-testid="register-with-google"
            >
              <SiGoogle className="h-4 w-4 me-2" />
              {getLocalizedText("التسجيل بواسطة Google", "Sign up with Google", "S'inscrire avec Google")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {getLocalizedText("أو بالبريد الإلكتروني", "or with email", "ou par email")}
                </span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {getLocalizedText("الاسم الكامل", "Full Name", "Nom Complet")} *
                </Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`ps-10 ${errors.name ? "border-destructive" : ""}`}
                    placeholder={getLocalizedText("أدخل اسمك الكامل", "Enter your full name", "Entrez votre nom complet")}
                    data-testid="input-register-name"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {getLocalizedText("البريد الإلكتروني", "Email Address", "Adresse Email")} *
                </Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`ps-10 ${errors.email ? "border-destructive" : ""}`}
                    placeholder="email@example.com"
                    dir="ltr"
                    data-testid="input-register-email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  {getLocalizedText("رقم الهاتف", "Phone Number", "Numéro de Téléphone")}
                  <span className="text-muted-foreground text-xs ms-1">
                    ({getLocalizedText("اختياري", "optional", "optionnel")})
                  </span>
                </Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`ps-10 ${errors.phone ? "border-destructive" : ""}`}
                    placeholder="+965 9XXX XXXX"
                    dir="ltr"
                    data-testid="input-register-phone"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {getLocalizedText("كلمة المرور", "Password", "Mot de Passe")} *
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`ps-10 ${errors.password ? "border-destructive" : ""}`}
                    placeholder={getLocalizedText("8 أحرف على الأقل مع رقم أو رمز", "8+ chars with number or symbol", "8+ caractères avec chiffre ou symbole")}
                    data-testid="input-register-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password}
                  </p>
                )}
                {formData.password && validatePassword(formData.password) && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {getLocalizedText("كلمة مرور قوية", "Strong password", "Mot de passe fort")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {getLocalizedText("تأكيد كلمة المرور", "Confirm Password", "Confirmer le Mot de Passe")} *
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`ps-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    placeholder={getLocalizedText("أعد إدخال كلمة المرور", "Re-enter password", "Ressaisir le mot de passe")}
                    data-testid="input-register-confirm-password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {getLocalizedText("كلمتا المرور متطابقتان", "Passwords match", "Mots de passe identiques")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode">
                  {getLocalizedText("كود الإحالة", "Referral Code", "Code de Parrainage")}
                  <span className="text-muted-foreground text-xs ms-1">
                    ({getLocalizedText("اختياري", "optional", "optionnel")})
                  </span>
                </Label>
                <div className="relative">
                  <Gift className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="referralCode"
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange("referralCode", e.target.value.toUpperCase())}
                    className="ps-10"
                    placeholder={getLocalizedText("أدخل الكود إن وجد", "Enter code if you have one", "Entrez le code si vous en avez un")}
                    data-testid="input-register-referral"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {getLocalizedText("جاري إنشاء الحساب...", "Creating account...", "Création du compte...")}
                  </>
                ) : (
                  getLocalizedText("إنشاء الحساب", "Create Account", "Créer le Compte")
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            <p className="text-muted-foreground w-full">
              {getLocalizedText("لديك حساب بالفعل؟", "Already have an account?", "Vous avez déjà un compte?")}{" "}
              <Link href="/login" className="text-primary hover:underline">
                {getLocalizedText("تسجيل الدخول", "Login", "Connexion")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
