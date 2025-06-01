import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { 
    transform: translateY(20px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
`;

// Styled Components
const MapContainer = styled.div`
  width: 100%;
  height: calc(100vh - 120px);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 16px;

  @media (max-width: 768px) {
    height: calc(100vh - 100px);
  }
`;

const Title = styled.h2`
  text-align: center;
  padding: 20px 0;
  margin: 0;
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 600;
  background: linear-gradient(90deg, #f6f9fc, #ffffff);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    font-size: 1.4rem;
    padding: 16px 0;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.3s ease-out;
  
  @media (max-width: 480px) {
    width: 95%;
    padding: 16px;
  }
`;

const ModalTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
`;

const FolktaleList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FolktaleItem = styled.li`
  padding: 12px 16px;
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
  color: #3182ce;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 4px 0;

  &:hover {
    background-color: #ebf8ff;
    color: #2c5282;
    transform: translateX(4px);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CloseButton = styled.button`
  display: block;
  margin: 20px auto 0;
  padding: 10px 24px;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #2c5282;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 20px;
  color: #4a5568;
`;

const CountryMap = () => {
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
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#63b3ed',
            '#4299e1'
          ],
          "fill-opacity": 0.1,
        },
      });

      map.addLayer({
        id: "country-border",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#2d3748",
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
              `http://localhost:5000/api/folktales?region=${encodeURIComponent(country)}`
            );
            const data = await response.json();
            
            if (data.folktales && data.folktales.length > 0) {
              setFolktales(data.folktales);
              setShowModal(true);
            } else {
              alert(`No folktales found for ${country}`);
            }
          } catch (err) {
            console.error("Error fetching folktales:", err);
            alert("Failed to load folktales. Please try again.");
          } finally {
            setIsLoading(false);
          }
        }
      });

      map.on("mouseenter", "country-fill", (e) => {
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
          map.getCanvas().style.cursor = "pointer";
        }
      });

      map.on("mouseleave", "country-fill", () => {
        if (hoveredCountryId !== null) {
          map.setFeatureState(
            { source: 'countries', id: hoveredCountryId },
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
    <div style={{ padding: "0 16px", maxWidth: "1400px", margin: "0 auto" }}>
      <Title>🌍 Click a Country to Explore Its Folktales</Title>
      <MapContainer ref={mapRef} />

      {showModal && (
        <ModalBackdrop onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Folktales from {selectedCountry}</ModalTitle>
            
            {isLoading ? (
              <LoadingIndicator>Loading folktales...</LoadingIndicator>
            ) : (
              <FolktaleList>
                {folktales.map((folktale) => (
                  <FolktaleItem
                    key={folktale._id}
                    onClick={() => handleFolktaleClick(folktale._id)}
                  >
                    {folktale.title}
                  </FolktaleItem>
                ))}
              </FolktaleList>
            )}
            
            <CloseButton onClick={() => setShowModal(false)}>
              Close
            </CloseButton>
          </ModalContent>
        </ModalBackdrop>
      )}
    </div>
  );
};

export default CountryMap;