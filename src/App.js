import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { featureCollection, point } from '@turf/turf';
import axios from 'axios';
import { findShortestRoute } from './tsp.js';
mapboxgl.accessToken = 'pk.eyJ1Ijoic3VuYWhpcmkiLCJhIjoiY2xwMnhsaWw2MHN0azJqanphNDdtdmhxeCJ9.WRr7JxgBv7eD_E_kA9CFfg';

export default function App() {
    const mapContainer = useRef(null);
    const mapClickHandler = useRef(null);
    const map = useRef(null);
    var count = 0;
    const [markedDone, setMarkedDone] = useState(false);
    const [bestRoute, setBestRoute] = useState([]);
    const [bestDistance, setBestDistance] = useState(Infinity);
    const warehouseLocation = [105.7934, 21.0073];
    const warehouse = featureCollection([point(warehouseLocation)]);
    const [dropoffs, setDropOffs] = useState(featureCollection([]));
    const [turnInstructions, setTurnInstructions] = useState([]);
    const [totalDuration, setTotalDuration] = useState(0);
    useEffect(() => {
        if (map.current) return;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [105.7934, 21.0073],
            zoom: 15,
        });
        map.current.on('load', async () => {
            map.current.addLayer({
                id: 'warehouse',
                type: 'circle',
                source: {
                    data: warehouse,
                    type: 'geojson'
                },
                paint: {
                    'circle-radius': 20,
                    'circle-color': 'white',
                    'circle-stroke-color': '#3887be',
                    'circle-stroke-width': 3
                }
            });
            map.current.addLayer({
                id: 'warehouse-symbol',
                type: 'symbol',
                source: {
                    data: warehouse,
                    type: 'geojson'
                },
                layout: {
                    'text-field': '0',
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    'text-size': 30,
                    'text-offset': [0, -0.6],
                    'text-anchor': 'top'
                },
                paint: {
                    'text-color': '#3887be'
                }
            });
        });


        if (!markedDone) {
            mapClickHandler.current = handleMapClick;
            map.current.on('click', mapClickHandler.current);
        }

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            placeholder: 'Search for places in Ha Noi',
            bbox: [105.44, 20.53, 106.02, 21.23],
            countries: 'VN',
            language: 'vi-VN',
            enableHighAccuracy: true,
        });

        map.current.addControl(geocoder, 'top-right');

        const navigationControl = new mapboxgl.NavigationControl();
        map.current.addControl(navigationControl);

        const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true,
            },
            trackUserLocation: true,
        });
        map.current.addControl(geolocateControl);

    }, []);


    async function calculateDistanceMatrix() {

        const [lng, lat] = warehouseLocation;
        const dropoffCoordinates = dropoffs.features.map((dropoff) => dropoff.geometry.coordinates.join(','));
        const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${lng},${lat};${dropoffCoordinates.join(';')}?annotations=distance`;

        console.log(url);
        try {
            const response = await axios.get(url, {
                params: {
                    access_token: mapboxgl.accessToken,
                },
            });
            const distanceMatrix = response.data.distances;
            console.log(distanceMatrix);
            const { route, distance } = findShortestRoute(distanceMatrix);
            console.log(route);
            console.log(distance);
            setBestRoute(route);
            try {
                let new_route = route.slice(1, -1);
                console.log(new_route);
                // Trừ đi 1 cho các phần tử còn lại
                new_route = new_route.map((element) => element - 1);
                const sortedCoordinates = new_route.map((index) => dropoffCoordinates[index]);
                console.log(sortedCoordinates);
                const response2 = await axios.get('https://api.mapbox.com/directions/v5/mapbox/driving/' + `${lng},${lat};` + sortedCoordinates.join(';') + `;${lng},${lat}`, {
                    params: {
                        access_token: mapboxgl.accessToken,
                        geometries: 'geojson',
                        steps: true,
                        overview: 'full',
                        language: 'vi-VN',
                    },
                });

                const directionsData = response2.data;
                console.log(directionsData);
                const steps = directionsData.routes[0].legs.flatMap(leg => leg.steps);
                // const durations = steps.map(step => step.duration);
                setTurnInstructions(steps.map(step => step.maneuver.instruction));
                const totalDurationInSeconds = directionsData.routes[0].duration;
                setBestDistance(directionsData.routes[0].distance);
                // durations.reduce((total, duration) => total + duration, 0);
                setTotalDuration(totalDurationInSeconds);



                // Vẽ directions lên bản đồ
                map.current.addLayer({
                    id: 'directions',
                    type: 'line',
                    source: {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            geometry: directionsData.routes[0].geometry,
                        },
                    },
                    paint: {
                        'line-color': '#3887be',
                        'line-width': 5,
                        'line-opacity': 0.75,
                    },
                });
            } catch (error) {
                console.error('Error calculating directions:', error);
            }

        } catch (error) {
            console.error('Error calculating distance matrix:', error);
        }
    }

    function handleMapClick(e) {

        map.current.addLayer({
            id: `dropoff-${count}`,
            type: 'circle',
            source: {
                data: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [e.lngLat.lng, e.lngLat.lat]
                            }
                        }
                    ]
                },
                type: 'geojson'
            },

            paint: {
                'circle-radius': 12,
                'circle-color': '#ff0000',
            },

        });
        map.current.addLayer({
            id: `dropoff-${count}-symbol`,
            type: 'symbol',
            source: {
                data: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [e.lngLat.lng, e.lngLat.lat]
                            }
                        }
                    ]
                },
                type: 'geojson'
            },
            layout: {
                'icon-size': 1.5,
                'text-field': `${count + 1}`,
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-offset': [0, 0.9],
                'text-anchor': 'top',
            },

        });
        count = count + 1;
        dropoffs.features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [e.lngLat.lng, e.lngLat.lat]
            }
        });
        console.log(dropoffs.features.length);
        console.log(dropoffs.features);

    }
    function handleReset() {
        for (let i = 0; i < dropoffs.features.length; i++) {
            map.current.removeLayer(`dropoff-${i}`);
            map.current.removeSource(`dropoff-${i}`);
            map.current.removeLayer(`dropoff-${i}-symbol`);
            map.current.removeSource(`dropoff-${i}-symbol`);
        }
        dropoffs.features = [];
        setBestRoute([]);
        setBestDistance(Infinity);
        setTurnInstructions([]);
        setTotalDuration(0);
        setMarkedDone(false);

        if (map.current.getLayer('directions')) {
            map.current.removeLayer('directions');
            map.current.removeSource('directions');
        }
        // Remove the previous event listener
        if (mapClickHandler.current) {
            map.current.off('click', mapClickHandler.current);
        }
        mapClickHandler.current = handleMapClick;
        map.current.on('click', mapClickHandler.current);

        count = 0;
    }

    function handleConfirm() {
        setMarkedDone(true);
        if (mapClickHandler.current) {
            map.current.off('click', mapClickHandler.current);
        }
        calculateDistanceMatrix();
    }
    return (
        <div>
            <div className="sidebar">

                {!markedDone && (
                    <button onClick={handleConfirm}>Start Route</button>
                )}
                {markedDone && (
                    <div>
                        <h2>Best Route:</h2>
                        <p>{bestRoute.join(' -> ')}</p>
                        <h2>Best Distance:</h2>
                        <p>{(bestDistance / 1000).toFixed(2)} km</p>
                        <h2>Trip duration:</h2>
                        <p>{Math.floor(totalDuration / 60)} min 🚗</p>
                        <h2>Turn Instructions:</h2>
                        <ol>
                            {turnInstructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                            ))}
                        </ol>
                        <button onClick={handleReset}>Reset</button>
                    </div>
                )}
            </div>
            <div ref={mapContainer} className="map-container" />
        </div>
    );
}

