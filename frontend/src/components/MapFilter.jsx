import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CountryMap() {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const [folktales, setFolktales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let map;
    try {
      map = new maplibregl.Map({
        container: mapRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [0, 20],
        zoom: 1.5,
      });

      map.on('load', () => {
        try {
          map.addSource('countries', {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',
          });

          map.addLayer({
            id: 'country-fill',
            type: 'fill',
            source: 'countries',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#63b3ed',
                '#4299e1',
              ],
              'fill-opacity': 0.1,
            },
          });

          map.addLayer({
            id: 'country-border',
            type: 'line',
            source: 'countries',
            paint: {
              'line-color': '#2d3748',
              'line-width': 1,
            },
          });

          let hoveredCountryId = null;

          map.on('click', 'country-fill', async (e) => {
            if (e.features.length === 0) {
              toast.warn('No country selected. Please click on a valid country.');
              return;
            }

            const properties = e.features[0].properties;
            const country = properties.name || 'Unknown country';
            setSelectedCountry(country);
            setIsLoading(true);

            try {
              const response = await fetch(
                `/api/folktales?region=${encodeURIComponent(country)}`
              );
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();

              if (data.data?.folktales?.length > 0) {
                setFolktales(data.data.folktales);
                setShowModal(true);
                toast.success(`Found ${data.data.folktales.length} folktale(s) for ${country}`);
              } else {
                toast.info(`No folktales found for ${country}`);
                setFolktales([]);
                setShowModal(false);
              }
            } catch (error) {
              console.error('Error fetching folktales:', error);
              const errorMessage = handleError(error);
              toast.error(errorMessage);
            } finally {
              setIsLoading(false);
            }
          });

          map.on('mouseenter', 'country-fill', (e) => {
            if (e.features.length > 0) {
              if (hoveredCountryId !== null) {
                map.setFeatureState(
                  { source: 'countries', id: hoveredCountryId },
                  { hover: false }
                );
              }
              hoveredCountryId = e.features[0].id;
              map.setFeatureState(
                { source: 'countries', id: hoveredCountryId },
                { hover: true }
              );
              map.getCanvas().style.cursor = 'pointer';
            }
          });

          map.on('mouseleave', 'country-fill', () => {
            if (hoveredCountryId !== null) {
              map.setFeatureState(
                { source: 'countries', id: hoveredCountryId },
                { hover: false }
              );
            }
            hoveredCountryId = null;
            map.getCanvas().style.cursor = '';
          });

          map.on('error', (e) => {
            console.error('Map error:', e.error);
            toast.error('Failed to load map data. Please try again later.');
          });
        } catch (error) {
          console.error('Error setting up map layers:', error);
          toast.error('Failed to initialize map. Please refresh the page.');
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to load map. Please check your connection and try again.');
    }

    return () => {
      if (map) {
        try {
          map.remove();
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, []);

  const handleError = (error) => {
    const errorData = error.response?.data;
    const errorCode = errorData?.error;
    const message = errorData?.message || error.message || 'An unexpected error occurred';

    switch (errorCode) {
      case 'validation_error':
        return errorData.details?.map(err => err.msg).join(', ') || 'Invalid filter parameters';
      case 'server_error':
        return 'Failed to load folktales due to a server issue. Please try again later.';
      default:
        return message;
    }
  };

  const handleFolktaleClick = (id) => {
    if (!id) {
      toast.warn('Invalid folktale ID');
      return;
    }
    setShowModal(false);
    navigate(`/folktale/${id}`);
  };

  return (
    <div className="px-4 max-w-7xl mx-auto">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <h2 className="text-center py-5 text-2xl font-semibold text-gray-800 bg-gradient-to-r from-gray-50 to-white shadow-sm max-md:text-xl max-md:py-4">
        🌍 Click a Country to Explore Its Folktales
      </h2>
      <div
        ref={mapRef}
        className="w-full h-[calc(100vh-120px)] rounded-xl shadow-lg overflow-hidden mt-4 max-md:h-[calc(100vh-100px)]"
      />
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up max-sm:p-4 max-sm:w-[95%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-5 pb-3 border-b border-gray-200">
              Folktales from {selectedCountry || 'Unknown'}
            </h3>
            {isLoading ? (
              <div className="text-center py-5 text-gray-600">Loading folktales...</div>
            ) : (
              <ul className="list-none p-0 m-0">
                {folktales.length > 0 ? (
                  folktales.map((folktale) => (
                    <li
                      key={folktale._id || Math.random()}
                      onClick={() => handleFolktaleClick(folktale._id)}
                      className="p-3 border-b border-gray-100 text-blue-600 font-medium cursor-pointer rounded-md my-1 hover:bg-blue-50 hover:text-blue-800 hover:translate-x-1 transition-all duration-200 last:border-b-0"
                    >
                      {folktale.title || 'Untitled Folktale'}
                    </li>
                  ))
                ) : (
                  <li className="p-3 text-center text-gray-500">No folktales available</li>
                )}
              </ul>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="block mx-auto mt-5 px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 hover:-translate-y-px transition-all duration-200 active:translate-y-0"
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
