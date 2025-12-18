import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { Mail, Lock, User, Phone, Gift, Loader2 } from "lucide-react";
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
  
  const referralCodeFromUrl = new URLSearchParams(search).get("ref") || "";
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: referralCodeFromUrl,
  });

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t("common.error"),
        description: getLocalizedText(
          "كلمتا المرور غير متطابقتين",
          "Passwords do not match",
          "Les mots de passe ne correspondent pas"
        ),
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t("common.error"),
        description: getLocalizedText(
          "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
          "Password must be at least 6 characters",
          "Le mot de passe doit comporter au moins 6 caractères"
        ),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerWithEmail(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        formData.referralCode
      );
      toast({
        title: getLocalizedText("تم إنشاء الحساب", "Account Created", "Compte Créé"),
        description: getLocalizedText(
          "مرحباً بك في غسلة ستايل!",
          "Welcome to Ghasla Style!",
          "Bienvenue chez Ghasla Style!"
        ),
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || getLocalizedText(
          "فشل إنشاء الحساب",
          "Failed to create account",
          "Échec de la création du compte"
        ),
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
        title: getLocalizedText("تم تسجيل الدخول", "Login Successful", "Connexion Réussie"),
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.register")}</CardTitle>
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
              {t("auth.loginWithGoogle")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {getLocalizedText("أو", "or", "ou")}
                </span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="ps-10"
                    required
                    data-testid="input-register-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="ps-10"
                    placeholder="email@example.com"
                    required
                    dir="ltr"
                    data-testid="input-register-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.phone")}</Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="ps-10"
                    placeholder="+965 XXXX XXXX"
                    dir="ltr"
                    data-testid="input-register-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="ps-10"
                    required
                    data-testid="input-register-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="ps-10"
                    required
                    data-testid="input-register-confirm-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode">{t("auth.referralCode")}</Label>
                <div className="relative">
                  <Gift className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="referralCode"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                    className="ps-10"
                    placeholder={getLocalizedText("اختياري", "Optional", "Optionnel")}
                    data-testid="input-register-referral"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.register")
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            <p className="text-muted-foreground w-full">
              {t("auth.hasAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline">
                {t("auth.login")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
