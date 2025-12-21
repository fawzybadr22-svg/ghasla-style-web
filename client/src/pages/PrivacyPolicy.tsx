import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Phone, MapPin, Calendar } from "lucide-react";

export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  
  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const lastUpdated = "2024-12-21";

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl" data-testid="privacy-policy-title">
              {getLocalizedText("سياسة الخصوصية", "Privacy Policy", "Politique de Confidentialité")}
            </CardTitle>
            <p className="text-muted-foreground flex items-center justify-center gap-2 mt-2">
              <Calendar className="h-4 w-4" />
              {getLocalizedText(`آخر تحديث: ${lastUpdated}`, `Last Updated: ${lastUpdated}`, `Dernière mise à jour: ${lastUpdated}`)}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none p-6 md:p-8 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("مقدمة", "Introduction", "Introduction")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mt-4">
                {getLocalizedText(
                  "مرحباً بكم في غسلة ستايل (Ghasla Style). نحن نقدر ثقتكم ونلتزم بحماية خصوصيتكم. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتكم الشخصية عند استخدام تطبيقنا وخدماتنا لغسيل السيارات المتنقل في الكويت.",
                  "Welcome to Ghasla Style. We value your trust and are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our mobile car wash application and services in Kuwait.",
                  "Bienvenue chez Ghasla Style. Nous apprécions votre confiance et nous nous engageons à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles."
                )}
              </p>
            </section>

            {/* Data We Collect */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("البيانات التي نجمعها", "Data We Collect", "Données que Nous Collectons")}
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {getLocalizedText("المعلومات الشخصية", "Personal Information", "Informations Personnelles")}
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>{getLocalizedText("الاسم الكامل", "Full name", "Nom complet")}</li>
                    <li>{getLocalizedText("البريد الإلكتروني", "Email address", "Adresse e-mail")}</li>
                    <li>{getLocalizedText("رقم الهاتف", "Phone number", "Numéro de téléphone")}</li>
                    <li>{getLocalizedText("عنوان الموقع للخدمة", "Service location address", "Adresse du lieu de service")}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {getLocalizedText("معلومات السيارة", "Vehicle Information", "Informations sur le Véhicule")}
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>{getLocalizedText("نوع وموديل السيارة", "Car make and model", "Marque et modèle de voiture")}</li>
                    <li>{getLocalizedText("لون السيارة", "Car color", "Couleur de la voiture")}</li>
                    <li>{getLocalizedText("رقم اللوحة", "License plate number", "Numéro de plaque")}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {getLocalizedText("بيانات الاستخدام", "Usage Data", "Données d'Utilisation")}
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>{getLocalizedText("سجل الطلبات والحجوزات", "Order and booking history", "Historique des commandes")}</li>
                    <li>{getLocalizedText("نقاط الولاء والمكافآت", "Loyalty points and rewards", "Points de fidélité")}</li>
                    <li>{getLocalizedText("تفضيلات الخدمة", "Service preferences", "Préférences de service")}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("كيف نستخدم بياناتكم", "How We Use Your Data", "Comment Nous Utilisons Vos Données")}
              </h2>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>{getLocalizedText("معالجة وتنفيذ طلبات غسيل السيارات", "Process and fulfill car wash orders", "Traiter et exécuter les commandes de lavage")}</li>
                <li>{getLocalizedText("التواصل معكم بخصوص الحجوزات والعروض", "Communicate with you about bookings and offers", "Communiquer avec vous concernant les réservations")}</li>
                <li>{getLocalizedText("إدارة برنامج نقاط الولاء", "Manage the loyalty points program", "Gérer le programme de fidélité")}</li>
                <li>{getLocalizedText("تحسين خدماتنا وتجربة المستخدم", "Improve our services and user experience", "Améliorer nos services")}</li>
                <li>{getLocalizedText("الامتثال للمتطلبات القانونية", "Comply with legal requirements", "Respecter les exigences légales")}</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("مشاركة البيانات", "Data Sharing", "Partage des Données")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "نحن لا نبيع معلوماتكم الشخصية. قد نشارك بياناتكم مع:",
                  "We do not sell your personal information. We may share your data with:",
                  "Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos données avec:"
                )}
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                <li>{getLocalizedText("فريق المندوبين لتنفيذ الخدمة", "Our service delegates to fulfill orders", "Nos délégués de service")}</li>
                <li>{getLocalizedText("مزودي خدمات الدفع الآمن", "Secure payment service providers", "Fournisseurs de paiement sécurisé")}</li>
                <li>{getLocalizedText("خدمات Firebase للمصادقة", "Firebase Authentication services", "Services d'authentification Firebase")}</li>
                <li>{getLocalizedText("السلطات القانونية عند الطلب الرسمي", "Legal authorities when officially required", "Autorités légales si requis")}</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("أمان البيانات", "Data Security", "Sécurité des Données")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "نستخدم تقنيات أمان متقدمة لحماية بياناتكم، تشمل: التشفير أثناء النقل والتخزين، المصادقة الآمنة عبر Firebase، مراقبة مستمرة للوصول غير المصرح به، ونسخ احتياطي منتظم للبيانات.",
                  "We use advanced security technologies to protect your data, including: encryption during transit and storage, secure Firebase authentication, continuous monitoring for unauthorized access, and regular data backups.",
                  "Nous utilisons des technologies de sécurité avancées pour protéger vos données, notamment: le chiffrement pendant le transit et le stockage, l'authentification Firebase sécurisée, la surveillance continue."
                )}
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("حقوقكم", "Your Rights", "Vos Droits")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText("لديكم الحق في:", "You have the right to:", "Vous avez le droit de:")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                <li>{getLocalizedText("الوصول إلى بياناتكم الشخصية", "Access your personal data", "Accéder à vos données personnelles")}</li>
                <li>{getLocalizedText("تصحيح أي معلومات غير دقيقة", "Correct any inaccurate information", "Corriger toute information inexacte")}</li>
                <li>{getLocalizedText("طلب حذف حسابكم وبياناتكم", "Request deletion of your account and data", "Demander la suppression de votre compte")}</li>
                <li>{getLocalizedText("سحب الموافقة في أي وقت", "Withdraw consent at any time", "Retirer votre consentement à tout moment")}</li>
                <li>{getLocalizedText("تصدير بياناتكم بصيغة قابلة للقراءة", "Export your data in a readable format", "Exporter vos données dans un format lisible")}</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("الاحتفاظ بالبيانات", "Data Retention", "Conservation des Données")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "نحتفظ ببياناتكم طالما حسابكم نشط أو حسب الحاجة لتقديم الخدمات. يمكنكم طلب حذف حسابكم في أي وقت من صفحة الحساب أو بالتواصل معنا. سيتم حذف البيانات خلال 30 يوماً من طلب الحذف، باستثناء البيانات المطلوبة قانونياً.",
                  "We retain your data as long as your account is active or as needed to provide services. You can request account deletion at any time from your account page or by contacting us. Data will be deleted within 30 days of the deletion request, except for legally required data.",
                  "Nous conservons vos données tant que votre compte est actif. Vous pouvez demander la suppression de votre compte à tout moment. Les données seront supprimées dans les 30 jours suivant la demande."
                )}
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("خدمات الطرف الثالث", "Third-Party Services", "Services Tiers")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText("نستخدم الخدمات التالية:", "We use the following services:", "Nous utilisons les services suivants:")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                <li><strong>Firebase Authentication:</strong> {getLocalizedText("للمصادقة الآمنة", "For secure authentication", "Pour l'authentification sécurisée")}</li>
                <li><strong>Google Analytics:</strong> {getLocalizedText("لتحليل استخدام التطبيق", "For app usage analytics", "Pour l'analyse de l'utilisation")}</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("خصوصية الأطفال", "Children's Privacy", "Confidentialité des Enfants")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "خدماتنا غير موجهة للأطفال دون سن 18 عاماً. لا نجمع عن علم معلومات شخصية من الأطفال. إذا علمنا بجمع بيانات طفل، سنحذفها فوراً.",
                  "Our services are not directed to children under 18 years of age. We do not knowingly collect personal information from children. If we learn that we have collected data from a child, we will delete it immediately.",
                  "Nos services ne s'adressent pas aux enfants de moins de 18 ans. Nous ne collectons pas sciemment d'informations personnelles auprès d'enfants."
                )}
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-muted/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("اتصل بنا", "Contact Us", "Contactez-Nous")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "لأي استفسارات حول سياسة الخصوصية أو لممارسة حقوقكم:",
                  "For any questions about this Privacy Policy or to exercise your rights:",
                  "Pour toute question sur cette politique de confidentialité:"
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

            {/* Policy Changes */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("تغييرات السياسة", "Policy Changes", "Modifications de la Politique")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "قد نحدث سياسة الخصوصية هذه من وقت لآخر. سنخطركم بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق. استمراركم في استخدام الخدمة بعد التحديثات يعني موافقتكم على السياسة المحدثة.",
                  "We may update this Privacy Policy from time to time. We will notify you of any material changes via email or in-app notification. Your continued use of the service after updates constitutes acceptance of the updated policy.",
                  "Nous pouvons mettre à jour cette politique de temps en temps. Nous vous informerons de tout changement important par e-mail ou notification dans l'application."
                )}
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
