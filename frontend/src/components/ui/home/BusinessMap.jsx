import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { BiMapPin, BiStore, BiPhone, BiEnvelope } from "react-icons/bi";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Custom styles for eKahera markers and popups
const ekaheraMarkerStyles = `
  .ekahera-marker {
    background: transparent !important;
    border: none !important;
  }
  
  .ekahera-popup .leaflet-popup-content-wrapper {
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .ekahera-popup .leaflet-popup-content {
    margin: 0;
    padding: 0;
  }
  
  .ekahera-popup .leaflet-popup-tip {
    background: white;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = ekaheraMarkerStyles;
  document.head.appendChild(styleSheet);
}

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Create custom eKahera pin icon
const createEKaheraIcon = () => {
  return L.divIcon({
    className: "ekahera-marker",
    html: `
      <div style="
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 18px;
          text-align: center;
          line-height: 1;
        ">eK</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Component to fit map bounds to show all markers
function MapBounds({ businesses }) {
  const map = useMap();

  useEffect(() => {
    if (businesses.length > 0) {
      const bounds = L.latLngBounds(
        businesses
          .filter((b) => b.lat && b.lng)
          .map((b) => [b.lat, b.lng])
      );

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [businesses, map]);

  return null;
}

export default function BusinessMap({ businesses, filterRegion }) {
  const mapRef = useRef(null);

  // Filter businesses by region if filter is applied
  const filteredBusinesses = filterRegion
    ? businesses.filter((b) => b.region === filterRegion)
    : businesses;

  // Filter out businesses without coordinates
  const businessesWithCoords = filteredBusinesses.filter(
    (b) => b.lat && b.lng
  );

  // Default center (Philippines)
  const defaultCenter = [12.8797, 121.774];
  const defaultZoom = 6;

  if (businessesWithCoords.length === 0) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <BiMapPin className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">
            {filterRegion
              ? `No businesses with location data in ${filterRegion}`
              : "No businesses with location data available"}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Addresses are being geocoded. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds businesses={businessesWithCoords} />
        {businessesWithCoords.map((business) => (
          <Marker
            key={business.business_id}
            position={[business.lat, business.lng]}
            icon={createEKaheraIcon()}
          >
            <Popup className="ekahera-popup">
              <div className="p-2 min-w-[250px]">
                <div className="flex items-start gap-2 mb-3">
                  <BiStore className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {business.business_name}
                    </h3>
                    {business.business_type && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-2">
                        {business.business_type}
                      </span>
                    )}
                  </div>
                </div>

                {business.address && (
                  <div className="flex items-start gap-2 mb-2">
                    <BiMapPin className="text-gray-500 mt-0.5 flex-shrink-0" size={16} />
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {business.address}
                    </p>
                  </div>
                )}

                {business.mobile && (
                  <div className="flex items-center gap-2 mb-2">
                    <BiPhone className="text-gray-500 flex-shrink-0" size={16} />
                    <a
                      href={`tel:${business.mobile}`}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      {business.mobile}
                    </a>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-center gap-2">
                    <BiEnvelope className="text-gray-500 flex-shrink-0" size={16} />
                    <a
                      href={`mailto:${business.email}`}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors truncate"
                    >
                      {business.email}
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

