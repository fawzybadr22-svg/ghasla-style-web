import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, X, Check } from "lucide-react";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
  language: string;
}

export function MapPicker({
  initialLat = 29.3759,
  initialLng = 47.9774,
  onLocationSelect,
  onClose,
  language,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const getLocalizedText = (ar: string, en: string) => {
    return language === "ar" ? ar : en;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lng}&lang=${language}`
      );
      const data = await response.json();
      if (data.display_name) {
        return data.display_name.split(",").slice(0, 3).join(",");
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const updateMarkerPosition = async (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    setIsLoading(true);
    const newAddress = await reverseGeocode(lat, lng);
    setAddress(newAddress);
    setIsLoading(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
        }
        await updateMarkerPosition(latitude, longitude);
        setIsLocating(false);
      },
      async () => {
        setIsLocating(false);
        // Try IP-based fallback
        try {
          const response = await fetch("/api/geocode/ip-location");
          const data = await response.json();
          if (data.success && mapInstanceRef.current) {
            mapInstanceRef.current.setView([data.lat, data.lon], 14);
            await updateMarkerPosition(data.lat, data.lon);
          }
        } catch {}
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLat, selectedLng, address);
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 14);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      await updateMarkerPosition(pos.lat, pos.lng);
    });

    map.on("click", async (e: L.LeafletMouseEvent) => {
      await updateMarkerPosition(e.latlng.lat, e.latlng.lng);
    });

    // Initial reverse geocode
    reverseGeocode(initialLat, initialLng).then(setAddress);

    // Try to get user's location on mount
    handleLocateMe();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between gap-2 p-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">
              {getLocalizedText("حدد موقعك على الخريطة", "Select your location on the map")}
            </h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-map">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative flex-1 min-h-[400px]">
          <div ref={mapRef} className="absolute inset-0" />
          
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 ltr:right-2 rtl:left-2 z-[1000] shadow-md"
            onClick={handleLocateMe}
            disabled={isLocating}
            data-testid="button-locate-me"
          >
            <Navigation className={`h-4 w-4 ${isLocating ? "animate-pulse" : ""}`} />
            <span className="ml-1 rtl:mr-1 rtl:ml-0">
              {getLocalizedText("موقعي", "My Location")}
            </span>
          </Button>
        </div>

        <div className="p-4 border-t space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {getLocalizedText("العنوان المحدد:", "Selected address:")}
            </span>
            <p className="font-medium mt-1">
              {isLoading ? getLocalizedText("جاري التحميل...", "Loading...") : address}
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            {getLocalizedText(
              "اسحب العلامة أو انقر على الخريطة لتحديد موقعك بدقة",
              "Drag the marker or click on the map to pinpoint your location"
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel-map">
              {getLocalizedText("إلغاء", "Cancel")}
            </Button>
            <Button onClick={handleConfirm} className="flex-1" disabled={isLoading} data-testid="button-confirm-location">
              <Check className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {getLocalizedText("تأكيد الموقع", "Confirm Location")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
