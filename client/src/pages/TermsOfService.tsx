import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mail, Phone, MapPin, Calendar } from "lucide-react";

export default function TermsOfService() {
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
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl" data-testid="terms-of-service-title">
              {getLocalizedText("شروط الاستخدام", "Terms of Service", "Conditions d'Utilisation")}
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
                  "مرحباً بكم في غسلة ستايل. باستخدامكم لتطبيقنا وخدماتنا، فإنكم توافقون على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام خدماتنا.",
                  "Welcome to Ghasla Style. By using our application and services, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.",
                  "Bienvenue chez Ghasla Style. En utilisant notre application et nos services, vous acceptez d'être lié par ces conditions générales."
                )}
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("وصف الخدمة", "Service Description", "Description du Service")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "غسلة ستايل هي خدمة غسيل سيارات متنقلة تعمل في دولة الكويت. نقدم خدمات غسيل وتنظيف السيارات في موقعكم المحدد من خلال فريق من المندوبين المدربين.",
                  "Ghasla Style is a mobile car wash service operating in Kuwait. We provide car washing and cleaning services at your specified location through a team of trained delegates.",
                  "Ghasla Style est un service de lavage de voiture mobile opérant au Koweït. Nous fournissons des services de lavage à votre emplacement."
                )}
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("حسابات المستخدمين", "User Accounts", "Comptes Utilisateurs")}
              </h2>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>{getLocalizedText("يجب أن يكون عمرك 18 عاماً أو أكثر لإنشاء حساب", "You must be 18 years or older to create an account", "Vous devez avoir 18 ans ou plus pour créer un compte")}</li>
                <li>{getLocalizedText("أنت مسؤول عن الحفاظ على سرية معلومات حسابك", "You are responsible for maintaining the confidentiality of your account information", "Vous êtes responsable de la confidentialité de votre compte")}</li>
                <li>{getLocalizedText("يجب تقديم معلومات دقيقة وحديثة", "You must provide accurate and current information", "Vous devez fournir des informations exactes et à jour")}</li>
                <li>{getLocalizedText("أنت مسؤول عن جميع الأنشطة التي تتم تحت حسابك", "You are responsible for all activities under your account", "Vous êtes responsable de toutes les activités sous votre compte")}</li>
              </ul>
            </section>

            {/* Booking and Payment */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("الحجز والدفع", "Booking and Payment", "Réservation et Paiement")}
              </h2>
              <div className="mt-4 space-y-4 text-muted-foreground">
                <p>
                  {getLocalizedText(
                    "عند إجراء حجز، فإنك توافق على دفع السعر المحدد للخدمة المختارة. الأسعار قابلة للتغيير وسيتم إخطارك بأي تغييرات قبل تأكيد الحجز.",
                    "When making a booking, you agree to pay the specified price for the selected service. Prices are subject to change and you will be notified of any changes before booking confirmation.",
                    "Lors d'une réservation, vous acceptez de payer le prix spécifié pour le service sélectionné."
                  )}
                </p>
                <p>
                  <strong>{getLocalizedText("طرق الدفع المقبولة:", "Accepted Payment Methods:", "Méthodes de paiement acceptées:")}</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{getLocalizedText("الدفع النقدي عند الخدمة", "Cash payment upon service", "Paiement en espèces")}</li>
                  <li>{getLocalizedText("التحويل البنكي", "Bank transfer", "Virement bancaire")}</li>
                  <li>{getLocalizedText("نقاط الولاء (حسب الرصيد المتاح)", "Loyalty points (subject to available balance)", "Points de fidélité")}</li>
                </ul>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("سياسة الإلغاء", "Cancellation Policy", "Politique d'Annulation")}
              </h2>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>{getLocalizedText("يمكنك إلغاء الحجز مجاناً قبل ساعتين من الموعد المحدد", "You can cancel a booking free of charge up to 2 hours before the scheduled time", "Vous pouvez annuler gratuitement jusqu'à 2 heures avant")}</li>
                <li>{getLocalizedText("الإلغاء بعد هذا الوقت قد يخضع لرسوم إلغاء", "Cancellations after this time may be subject to a cancellation fee", "Les annulations après ce délai peuvent être soumises à des frais")}</li>
                <li>{getLocalizedText("نحتفظ بالحق في إلغاء الخدمة في حالات الطوارئ أو الظروف الجوية السيئة", "We reserve the right to cancel services in case of emergencies or bad weather conditions", "Nous nous réservons le droit d'annuler en cas d'urgence ou de mauvais temps")}</li>
              </ul>
            </section>

            {/* Service Guarantee */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("ضمان الخدمة", "Service Guarantee", "Garantie de Service")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "نلتزم بتقديم خدمة عالية الجودة. إذا لم تكن راضياً عن الخدمة، يرجى إخطارنا خلال 24 ساعة وسنعمل على حل المشكلة أو إعادة الخدمة مجاناً.",
                  "We are committed to providing high-quality service. If you are not satisfied with the service, please notify us within 24 hours and we will work to resolve the issue or re-do the service free of charge.",
                  "Nous nous engageons à fournir un service de haute qualité. Si vous n'êtes pas satisfait, veuillez nous informer dans les 24 heures."
                )}
              </p>
            </section>

            {/* Loyalty Program */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("برنامج الولاء", "Loyalty Program", "Programme de Fidélité")}
              </h2>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>{getLocalizedText("تكسب نقاطاً على كل خدمة مكتملة", "You earn points on every completed service", "Vous gagnez des points sur chaque service")}</li>
                <li>{getLocalizedText("يمكن استبدال النقاط بخصومات على الخدمات المستقبلية", "Points can be redeemed for discounts on future services", "Les points peuvent être échangés contre des réductions")}</li>
                <li>{getLocalizedText("النقاط غير قابلة للتحويل أو الاسترداد النقدي", "Points are non-transferable and have no cash value", "Les points ne sont pas transférables")}</li>
                <li>{getLocalizedText("نحتفظ بالحق في تعديل أو إنهاء البرنامج بإخطار مسبق", "We reserve the right to modify or terminate the program with prior notice", "Nous nous réservons le droit de modifier le programme")}</li>
              </ul>
            </section>

            {/* User Conduct */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("سلوك المستخدم", "User Conduct", "Conduite de l'Utilisateur")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText("عند استخدام خدماتنا، توافق على:", "When using our services, you agree to:", "En utilisant nos services, vous acceptez de:")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                <li>{getLocalizedText("معاملة موظفينا باحترام", "Treat our staff with respect", "Traiter notre personnel avec respect")}</li>
                <li>{getLocalizedText("توفير موقع آمن ومناسب للخدمة", "Provide a safe and suitable location for service", "Fournir un emplacement sûr pour le service")}</li>
                <li>{getLocalizedText("عدم استخدام التطبيق لأغراض غير قانونية", "Not use the app for illegal purposes", "Ne pas utiliser l'application à des fins illégales")}</li>
                <li>{getLocalizedText("عدم محاولة التلاعب بالنظام أو النقاط", "Not attempt to manipulate the system or points", "Ne pas tenter de manipuler le système")}</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("حدود المسؤولية", "Limitation of Liability", "Limitation de Responsabilité")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "نبذل قصارى جهدنا لتقديم خدمة آمنة وعالية الجودة. ومع ذلك، لن نكون مسؤولين عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام خدماتنا، إلى أقصى حد يسمح به القانون.",
                  "We do our best to provide a safe and high-quality service. However, we will not be liable for any indirect, incidental, or consequential damages resulting from the use of our services, to the maximum extent permitted by law.",
                  "Nous faisons de notre mieux pour fournir un service sûr et de qualité. Cependant, nous ne serons pas responsables des dommages indirects."
                )}
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("القانون الحاكم", "Governing Law", "Loi Applicable")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "تخضع هذه الشروط وتفسر وفقاً لقوانين دولة الكويت. أي نزاعات تنشأ عن هذه الشروط ستخضع للاختصاص القضائي الحصري لمحاكم الكويت.",
                  "These terms are governed by and construed in accordance with the laws of the State of Kuwait. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of Kuwaiti courts.",
                  "Ces conditions sont régies par les lois de l'État du Koweït. Tout litige sera soumis à la juridiction exclusive des tribunaux koweïtiens."
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
                  "لأي استفسارات حول شروط الاستخدام:",
                  "For any questions about these Terms of Service:",
                  "Pour toute question sur ces conditions:"
                )}
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>support@ghaslastyle.com</span>
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

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-bold text-foreground border-b pb-2">
                {getLocalizedText("تغييرات الشروط", "Changes to Terms", "Modifications des Conditions")}
              </h2>
              <p className="text-muted-foreground mt-4">
                {getLocalizedText(
                  "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنخطركم بأي تغييرات جوهرية. استمراركم في استخدام الخدمة بعد التعديلات يعني قبولكم للشروط المحدثة.",
                  "We reserve the right to modify these terms at any time. We will notify you of any material changes. Your continued use of the service after modifications constitutes acceptance of the updated terms.",
                  "Nous nous réservons le droit de modifier ces conditions à tout moment. Votre utilisation continue après les modifications constitue une acceptation."
                )}
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
