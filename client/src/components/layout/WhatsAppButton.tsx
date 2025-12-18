import { SiWhatsapp } from "react-icons/si";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/96596068518"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 animate-pulse hover:animate-none"
      data-testid="whatsapp-floating-button"
      aria-label="Contact via WhatsApp"
    >
      <SiWhatsapp className="h-7 w-7" />
    </a>
  );
}
