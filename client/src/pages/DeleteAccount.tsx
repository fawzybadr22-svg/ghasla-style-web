import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserX, AlertTriangle, Mail, Phone, MapPin, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function DeleteAccount() {
  const { i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [confirmText, setConfirmText] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const expectedText = getLocalizedText("حذف حسابي", "DELETE MY ACCOUNT", "SUPPRIMER MON COMPTE");
    if (confirmText !== expectedText) {
      toast({
        title: getLocalizedText("خطأ", "Error", "Erreur"),
        description: getLocalizedText(
          "يرجى كتابة نص التأكيد بشكل صحيح",
          "Please type the confirmation text correctly",
          "Veuillez taper le texte de confirmation correctement"
        ),
        variant: "destructive",
      });
      return;
    }

    if (!understood) {
      toast({
        title: getLocalizedText("خطأ", "Error", "Erreur"),
        description: getLocalizedText(
          "يرجى تأكيد فهمك للعواقب",
          "Please confirm your understanding of the consequences",
          "Veuillez confirmer votre compréhension des conséquences"
        ),
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${user.id}/delete-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast({
          title: getLocalizedText("تم إرسال الطلب", "Request Submitted", "Demande Soumise"),
          description: getLocalizedText(
            "سيتم حذف حسابك خلال 30 يوماً. ستتلقى تأكيداً بالبريد الإلكتروني.",
            "Your account will be deleted within 30 days. You will receive email confirmation.",
            "Votre compte sera supprimé dans les 30 jours. Vous recevrez une confirmation par e-mail."
          ),
        });
        await logout();
        setLocation("/");
      } else {
        throw new Error("Failed to submit deletion request");
      }
    } catch (error) {
      toast({
        title: getLocalizedText("خطأ", "Error", "Erreur"),
        description: getLocalizedText(
          "حدث خطأ. يرجى التواصل مع الدعم.",
          "An error occurred. Please contact support.",
          "Une erreur s'est produite. Veuillez contacter le support."
        ),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const lastUpdated = "2024-12-21";

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <UserX className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl" data-testid="delete-account-title">
              {getLocalizedText("حذف الحساب", "Account Deletion", "Suppression du Compte")}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-2 mt-2">
              <Calendar className="h-4 w-4" />
              {getLocalizedText(`آخر تحديث: ${lastUpdated}`, `Last Updated: ${lastUpdated}`, `Dernière mise à jour: ${lastUpdated}`)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            
            {/* Policy Information */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("سياسة حذف الحساب", "Account Deletion Policy", "Politique de Suppression")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mt-4">
                {getLocalizedText(
                  "نحترم حقك في حذف حسابك وبياناتك الشخصية. توضح هذه الصفحة كيفية طلب حذف حسابك وما يترتب على ذلك.",
                  "We respect your right to delete your account and personal data. This page explains how to request account deletion and what it entails.",
                  "Nous respectons votre droit de supprimer votre compte et vos données personnelles."
                )}
              </p>
            </section>

            {/* What Gets Deleted */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("ما الذي سيتم حذفه", "What Will Be Deleted", "Ce Qui Sera Supprimé")}
              </h2>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>{getLocalizedText("معلومات حسابك الشخصية (الاسم، البريد، الهاتف)", "Your personal account information (name, email, phone)", "Vos informations personnelles")}</li>
                <li>{getLocalizedText("سجل الطلبات والحجوزات", "Order and booking history", "Historique des commandes")}</li>
                <li>{getLocalizedText("رصيد نقاط الولاء", "Loyalty points balance", "Solde des points de fidélité")}</li>
                <li>{getLocalizedText("بيانات السيارة المحفوظة", "Saved vehicle information", "Informations de véhicule enregistrées")}</li>
                <li>{getLocalizedText("تفضيلات الإشعارات", "Notification preferences", "Préférences de notification")}</li>
              </ul>
            </section>

            {/* What May Be Retained */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("ما قد نحتفظ به", "What May Be Retained", "Ce Qui Peut Être Conservé")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "قد نحتفظ ببعض البيانات لأغراض قانونية أو تنظيمية:",
                  "We may retain some data for legal or regulatory purposes:",
                  "Nous pouvons conserver certaines données pour des raisons légales:"
                )}
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                <li>{getLocalizedText("سجلات المعاملات المالية (للمتطلبات الضريبية)", "Financial transaction records (for tax requirements)", "Registres financiers (pour les impôts)")}</li>
                <li>{getLocalizedText("سجلات الاتصال بالدعم الفني", "Customer support communication logs", "Journaux de communication support")}</li>
                <li>{getLocalizedText("بيانات مجهولة المصدر للتحليلات", "Anonymized data for analytics", "Données anonymisées pour analyses")}</li>
              </ul>
            </section>

            {/* Deletion Timeline */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("الجدول الزمني للحذف", "Deletion Timeline", "Délai de Suppression")}
              </h2>
              <div className="mt-4 space-y-3 text-muted-foreground">
                <p>
                  <strong>{getLocalizedText("الفوري:", "Immediate:", "Immédiat:")}</strong> {getLocalizedText("تعليق الوصول إلى الحساب", "Account access suspension", "Suspension de l'accès")}
                </p>
                <p>
                  <strong>{getLocalizedText("خلال 7 أيام:", "Within 7 days:", "Sous 7 jours:")}</strong> {getLocalizedText("حذف بيانات الحساب من الأنظمة النشطة", "Deletion of account data from active systems", "Suppression des systèmes actifs")}
                </p>
                <p>
                  <strong>{getLocalizedText("خلال 30 يوماً:", "Within 30 days:", "Sous 30 jours:")}</strong> {getLocalizedText("حذف البيانات من النسخ الاحتياطية", "Deletion from backup systems", "Suppression des sauvegardes")}
                </p>
              </div>
            </section>

            {/* How to Request */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("كيفية طلب الحذف", "How to Request Deletion", "Comment Demander la Suppression")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText("يمكنك طلب حذف حسابك بإحدى الطرق التالية:", "You can request account deletion through:", "Vous pouvez demander la suppression via:")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                <li>{getLocalizedText("استخدام النموذج أدناه (للمستخدمين المسجلين)", "Using the form below (for logged-in users)", "En utilisant le formulaire ci-dessous")}</li>
                <li>{getLocalizedText("إرسال بريد إلكتروني إلى privacy@ghaslastyle.com", "Sending an email to privacy@ghaslastyle.com", "En envoyant un e-mail à privacy@ghaslastyle.com")}</li>
                <li>{getLocalizedText("الاتصال بخدمة العملاء على الرقم أدناه", "Contacting customer service at the number below", "En contactant le service client")}</li>
              </ul>
            </section>

            {/* Deletion Form */}
            <section className="border-2 border-destructive/20 rounded-lg p-6 bg-destructive/5">
              {user ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <h2 className="text-xl font-bold text-destructive">
                      {getLocalizedText("طلب حذف الحساب", "Request Account Deletion", "Demander la Suppression")}
                    </h2>
                  </div>
                  
                  <p className="text-muted-foreground mb-6">
                    {getLocalizedText(
                      "تحذير: هذا الإجراء لا يمكن التراجع عنه. ستفقد جميع بياناتك ونقاط الولاء.",
                      "Warning: This action cannot be undone. You will lose all your data and loyalty points.",
                      "Avertissement: Cette action est irréversible. Vous perdrez toutes vos données."
                    )}
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="confirm-text">
                        {getLocalizedText(
                          `اكتب "${getLocalizedText("حذف حسابي", "DELETE MY ACCOUNT", "SUPPRIMER MON COMPTE")}" للتأكيد`,
                          `Type "${getLocalizedText("حذف حسابي", "DELETE MY ACCOUNT", "SUPPRIMER MON COMPTE")}" to confirm`,
                          `Tapez "${getLocalizedText("حذف حسابي", "DELETE MY ACCOUNT", "SUPPRIMER MON COMPTE")}" pour confirmer`
                        )}
                      </Label>
                      <Input
                        id="confirm-text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={getLocalizedText("حذف حسابي", "DELETE MY ACCOUNT", "SUPPRIMER MON COMPTE")}
                        data-testid="input-delete-confirm"
                      />
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="understood"
                        checked={understood}
                        onCheckedChange={(checked) => setUnderstood(checked === true)}
                        data-testid="checkbox-delete-understand"
                      />
                      <Label htmlFor="understood" className="text-sm text-muted-foreground leading-relaxed">
                        {getLocalizedText(
                          "أفهم أن حذف حسابي سيؤدي إلى فقدان جميع بياناتي ونقاط الولاء بشكل دائم ولا يمكن استعادتها.",
                          "I understand that deleting my account will permanently erase all my data and loyalty points, which cannot be recovered.",
                          "Je comprends que la suppression de mon compte effacera définitivement toutes mes données et points de fidélité."
                        )}
                      </Label>
                    </div>

                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !understood || confirmText !== getLocalizedText("حذف حسابي", "DELETE MY ACCOUNT", "SUPPRIMER MON COMPTE")}
                      data-testid="button-delete-account"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 me-2 animate-spin" />
                          {getLocalizedText("جاري المعالجة...", "Processing...", "Traitement...")}
                        </>
                      ) : (
                        getLocalizedText("حذف حسابي نهائياً", "Delete My Account Permanently", "Supprimer Mon Compte Définitivement")
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <h2 className="text-xl font-bold text-destructive">
                      {getLocalizedText("طلب حذف الحساب", "Request Account Deletion", "Demander la Suppression")}
                    </h2>
                  </div>
                  <p className="text-muted-foreground">
                    {getLocalizedText(
                      "لحذف حسابك، يرجى تسجيل الدخول أولاً أو إرسال طلب عبر البريد الإلكتروني:",
                      "To delete your account, please log in first or send a request via email:",
                      "Pour supprimer votre compte, veuillez vous connecter d'abord ou envoyer une demande par e-mail:"
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/login")}
                      data-testid="button-login-to-delete"
                    >
                      {getLocalizedText("تسجيل الدخول", "Log In", "Se Connecter")}
                    </Button>
                    <a href="mailto:privacy@ghaslastyle.com?subject=Account%20Deletion%20Request">
                      <Button variant="destructive" data-testid="button-email-deletion">
                        <Mail className="h-4 w-4 me-2" />
                        {getLocalizedText("إرسال طلب بالبريد", "Send Email Request", "Envoyer par E-mail")}
                      </Button>
                    </a>
                  </div>
                </div>
              )}
              </section>

            {/* Contact Information */}
            <section className="bg-muted/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("اتصل بنا", "Contact Us", "Contactez-Nous")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "للمساعدة في حذف حسابك أو أي استفسارات:",
                  "For help with account deletion or any questions:",
                  "Pour de l'aide avec la suppression ou toute question:"
                )}
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>privacy@ghaslastyle.com</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-5 w-5 text-primary" />
                  <span dir="ltr">+965 9796 0808</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{getLocalizedText("الكويت", "Kuwait", "Koweït")}</span>
                </div>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
