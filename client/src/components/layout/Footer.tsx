import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin } from "lucide-react";
import { SiWhatsapp, SiInstagram, SiX } from "react-icons/si";

export function Footer() {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/services", label: t("nav.services") },
    { href: "/booking", label: t("nav.booking") },
    { href: "/loyalty", label: t("nav.loyalty") },
    { href: "/friends-club", label: t("nav.friendsClub") },
    { href: "/blog", label: t("nav.blog") },
  ];

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">G</span>
              </div>
              <span className="text-2xl font-bold">{t("brand")}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/96597960808"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105"
                data-testid="social-whatsapp"
              >
                <SiWhatsapp className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white transition-transform hover:scale-105"
                data-testid="social-instagram"
              >
                <SiInstagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
                data-testid="social-twitter"
              >
                <SiX className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.quickLinks")}</h3>
            <nav className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.contactInfo")}</h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/96597960808"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <Phone className="h-4 w-4" />
                <span dir="ltr">+965 9796 0808</span>
              </a>
              <a
                href="mailto:info@ghaslastyle.com"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <Mail className="h-4 w-4" />
                <span>info@ghaslastyle.com</span>
              </a>
              <div className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {i18n.language === "ar" 
                    ? "الكويت - 19 منطقة متاحة" 
                    : i18n.language === "fr"
                    ? "Koweït - 19 zones disponibles"
                    : "Kuwait - 19 Areas Available"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {i18n.language === "ar" ? "اللغة" : i18n.language === "fr" ? "Langue" : "Language"}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => changeLanguage("ar")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  i18n.language === "ar"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-testid="footer-lang-ar"
              >
                العربية
              </button>
              <button
                onClick={() => changeLanguage("en")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  i18n.language === "en"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-testid="footer-lang-en"
              >
                English
              </button>
              <button
                onClick={() => changeLanguage("fr")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  i18n.language === "fr"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-testid="footer-lang-fr"
              >
                Français
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} {t("brand")}. {t("footer.rights")}.
          </p>
        </div>
      </div>

      {/* Designer Credit Bar - This is the personal contact of designer Fawzy Badr, NOT Ghasla Style support */}
      <div className="bg-muted/80 border-t py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            {/* Copyright - Left on desktop */}
            <p className="text-muted-foreground order-2 md:order-1">
              © {currentYear} Ghasla Style
            </p>

            {/* Designer Credit - Center */}
            <p className="order-1 md:order-2 flex items-center gap-1.5">
              <span className="text-muted-foreground">Designed by</span>
              <span 
                className="font-semibold text-chart-1 hover:text-primary transition-colors cursor-default"
                data-testid="text-designer-name"
              >
                Fawzy Badr
              </span>
            </p>

            {/* Designer WhatsApp - Right on desktop */}
            {/* NOTE: This is the designer's personal WhatsApp (Fawzy Badr), NOT Ghasla Style booking/support */}
            <a
              href="https://wa.me/201281863902"
              target="_blank"
              rel="noopener noreferrer"
              className="order-3 flex items-center gap-2 text-muted-foreground hover:text-[#25D366] transition-all hover:scale-105"
              title="Contact Designer - Fawzy Badr"
              data-testid="link-designer-whatsapp"
            >
              <SiWhatsapp className="h-5 w-5" />
              <span className="text-xs hidden sm:inline">Designer Contact</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
