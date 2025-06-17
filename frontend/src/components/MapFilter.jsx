import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "react-router-dom";

function CountryMap() {
  const mapRef = useRef(null);
  const navigate = useNavigate();

  const [folktales, setFolktales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 20],
      zoom: 1.5,
    });

    map.on("load", () => {
      map.addSource("countries", {
        type: "geojson",
        data: "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
      });

      map.addLayer({
        id: "country-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#f6ad55",
            "#f6ad55",
          ],
          "fill-opacity": 0.3,
        },
      });

      map.addLayer({
        id: "country-border",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#744210",
          "line-width": 1,
        },
      });

      let hoveredCountryId = null;

      map.on("click", "country-fill", async (e) => {
        if (e.features.length > 0) {
          const properties = e.features[0].properties;
          const country = properties.name || "Unknown country";
          setSelectedCountry(country);
          setIsLoading(true);

          try {
            const response = await fetch(
              `/api/folktales?region=${encodeURIComponent(country)}`
            );
            const data = await response.json();
            
            if (data.folktales && data.folktales.length > 0) {
              setFolktales(data.folktales);
              setShowModal(true);
            } else {
              setShowModal(true);
              setFolktales([]);
            }
          } catch (err) {
            console.error("Error fetching legends:", err);
            setShowModal(true);
            setFolktales([]);
          } finally {
            setIsLoading(false);
          }
        }
      });

      map.on("mouseenter", "country-fill", (e) => {
        if (e.features.length > 0) {
          if (hoveredCountryId !== null) {
            map.setFeatureState(
              { source: "countries", id: hoveredCountryId },
              { hover: false }
            );
          }
          hoveredCountryId = e.features[0].id;
          map.setFeatureState(
            { source: "countries", id: hoveredCountryId },
            { hover: true }
          );
          map.getCanvas().style.cursor = "pointer";
        }
      });

      map.on("mouseleave", "country-fill", () => {
        if (hoveredCountryId !== null) {
          map.setFeatureState(
            { source: "countries", id: hoveredCountryId },
            { hover: false }
          );
        }
        hoveredCountryId = null;
        map.getCanvas().style.cursor = "";
      });
    });

    return () => map.remove();
  }, []);

  const handleFolktaleClick = (id) => {
    setShowModal(false);
    navigate(`/folktale/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 font-caveat text-gray-800 animate-fadeIn">
      <h2 className="text-center py-5 text-2xl md:text-3xl font-semibold text-amber-900 bg-gradient-to-r from-amber-50 to-orange-100 shadow-sm mb-4 animate-pulseSketchy">
        🌍 Click a Country to Explore Its Legends
      </h2>
      <div
        ref={mapRef}
        className="w-full h-[calc(100vh-120px)] rounded-xl shadow-md overflow-hidden mt-4 md:h-[calc(100vh-100px)]"
      />

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] animate-fadeIn backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-amber-200 transform transition-all duration-300 translate-y-0 opacity-100 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg md:text-xl font-semibold text-amber-900 mb-5 text-center border-b-2 border-amber-200 pb-3">
              Legends from {selectedCountry}
            </h3>
            
            {isLoading ? (
              <div className="text-center p-5 text-gray-600 text-base animate-pulseSketchy">
                Loading Legends...
              </div>
            ) : folktales.length === 0 ? (
              <div className="text-center p-5 text-gray-600 text-base animate-shake">
                No Legends found for {selectedCountry}.
              </div>
            ) : (
              <ul className="list-none p-0 m-0">
                {folktales.map((folktale) => (
                  <li
                    key={folktale._id}
                    className="p-3 border-b border-amber-100 text-amber-700 font-medium cursor-pointer hover:bg-amber-50 hover:text-amber-900 rounded-md my-1 transition-all duration-200 hover:translate-x-1 last:border-b-0"
                    onClick={() => handleFolktaleClick(folktale._id)}
                  >
                    {folktale.title}
                  </li>
                ))}
              </ul>
            )}
            
            <button
              className="block mt-5 mx-auto px-6 py-2 bg-amber-900 text-white rounded-md text-base font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CountryMap;
