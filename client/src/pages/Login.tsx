import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with email:", formData.email);
      await loginWithEmail(formData.email, formData.password);
      console.log("Login successful, redirecting...");
      toast({
        title: getLocalizedText("تم تسجيل الدخول", "Login Successful", "Connexion Réussie"),
      });
      setLocation("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: t("common.error"),
        description: error.message || getLocalizedText(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          "Invalid email or password",
          "Email ou mot de passe incorrect"
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
        description: error.message || getLocalizedText(
          "فشل تسجيل الدخول بجوجل",
          "Google login failed",
          "Échec de connexion Google"
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 flex items-center justify-center min-h-[70vh]">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.login")}</CardTitle>
            <CardDescription>
              {getLocalizedText(
                "سجل دخولك للوصول إلى حسابك",
                "Sign in to access your account",
                "Connectez-vous pour accéder à votre compte"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              data-testid="login-with-google"
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

            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    data-testid="input-login-email"
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
                    data-testid="input-login-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.login")
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              {t("auth.forgotPassword")}
            </Link>
            <p className="text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="text-primary hover:underline">
                {t("auth.register")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
