export interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    condition: string;
    code: number;
    soilTemp: number;
    soilMoisture: number;
  };
  forecast: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    rainProb: number;
    condition: string;
    code: number;
  }>;
}

export async function getCoordinates(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    }
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,soil_temperature_6cm,soil_moisture_3_9cm&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    );
    const data = await response.json();
    
    return {
      current: {
        temp: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        condition: getWeatherDescription(data.current.weather_code),
        code: data.current.weather_code,
        soilTemp: data.current.soil_temperature_6cm,
        soilMoisture: data.current.soil_moisture_3_9cm
      },
      forecast: data.daily.time.map((time: string, index: number) => ({
        date: time,
        maxTemp: data.daily.temperature_2m_max[index],
        minTemp: data.daily.temperature_2m_min[index],
        rainProb: data.daily.precipitation_probability_max[index],
        condition: getWeatherDescription(data.daily.weather_code[index]),
        code: data.daily.weather_code[index]
      }))
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
}
