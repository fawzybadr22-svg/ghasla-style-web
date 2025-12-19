import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin, Send, MessageCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t("contact.success"),
          description: getLocalizedText(
            "سنتواصل معك قريباً",
            "We'll get back to you soon",
            "Nous vous répondrons bientôt"
          ),
        });
        setFormData({ name: "", phone: "", message: "" });
      } else {
        throw new Error("Failed to send");
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: getLocalizedText(
          "حاول مرة أخرى",
          "Please try again",
          "Veuillez réessayer"
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      labelAr: "الهاتف",
      labelEn: "Phone",
      labelFr: "Téléphone",
      value: "+965 9796 0808",
      href: "tel:+96597960808",
    },
    {
      icon: MessageCircle,
      labelAr: "واتساب",
      labelEn: "WhatsApp",
      labelFr: "WhatsApp",
      value: "+965 9796 0808",
      href: "https://wa.me/96597960808",
    },
    {
      icon: Mail,
      labelAr: "البريد الإلكتروني",
      labelEn: "Email",
      labelFr: "Email",
      value: "info@ghaslastyle.com",
      href: "mailto:info@ghaslastyle.com",
    },
    {
      icon: MapPin,
      labelAr: "الموقع",
      labelEn: "Location",
      labelFr: "Emplacement",
      value: getLocalizedText("الكويت - 19 منطقة متاحة", "Kuwait - 19 Areas Available", "Koweït - 19 zones disponibles"),
      href: null,
    },
  ];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-[#25D366] to-[#128C7E] p-6 text-white">
                <SiWhatsapp className="h-10 w-10 mb-4" />
                <h3 className="text-xl font-bold mb-2">{t("contact.whatsapp")}</h3>
                <p className="opacity-90">
                  {getLocalizedText(
                    "تواصل معنا مباشرة عبر واتساب",
                    "Contact us directly via WhatsApp",
                    "Contactez-nous directement via WhatsApp"
                  )}
                </p>
              </div>
              <CardContent className="p-6">
                <a
                  href="https://wa.me/96597960808"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-[#25D366] hover:bg-[#128C7E]" size="lg" data-testid="whatsapp-contact">
                    <SiWhatsapp className="h-5 w-5 me-2" />
                    {t("contact.whatsapp")}
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {getLocalizedText("معلومات التواصل", "Contact Information", "Coordonnées")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-center gap-4" data-testid={`contact-info-${index}`}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {getLocalizedText(item.labelAr, item.labelEn, item.labelFr)}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="font-medium hover:text-primary transition-colors"
                          dir="ltr"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {getLocalizedText("أرسل رسالة", "Send a Message", "Envoyer un Message")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("contact.name")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="input-contact-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("contact.phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    dir="ltr"
                    data-testid="input-contact-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t("contact.message")}</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    data-testid="input-contact-message"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-send-message">
                  {isSubmitting ? (
                    t("common.loading")
                  ) : (
                    <>
                      <Send className="h-4 w-4 me-2" />
                      {t("contact.send")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
