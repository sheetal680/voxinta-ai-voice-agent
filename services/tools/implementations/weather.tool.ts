import { z } from "zod";
import { ProviderError } from "@/services/shared/errors";
import type { ITool } from "../tools.interface";

/**
 * Weather tool backed by Open-Meteo (https://open-meteo.com) — a free
 * weather API that needs no API key/signup, so this tool works out of the
 * box with zero configuration. Geocodes the given place name to
 * coordinates, then reads current conditions for those coordinates.
 */
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather codes used by Open-Meteo's `current.weather_code`.
const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  56: "light freezing drizzle",
  57: "dense freezing drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  66: "light freezing rain",
  67: "heavy freezing rain",
  71: "slight snow fall",
  73: "moderate snow fall",
  75: "heavy snow fall",
  77: "snow grains",
  80: "slight rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  85: "slight snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with slight hail",
  99: "thunderstorm with heavy hail",
};

function describeWeatherCode(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] ?? `unknown conditions (code ${code})`;
}

interface GeocodingResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new ProviderError("tools", "Failed to reach the weather service.", {
      cause,
      providerId: "get_weather",
      retryable: true,
    });
  }
  if (!response.ok) {
    throw new ProviderError("tools", `Weather service error ${response.status}.`, {
      providerId: "get_weather",
      status: response.status,
      retryable: response.status >= 500,
    });
  }
  return (await response.json()) as T;
}

async function geocodeOnce(name: string): Promise<GeocodingResult | undefined> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const data = await fetchJson<GeocodingResponse>(url);
  return data.results?.[0];
}

async function geocodeLocation(location: string): Promise<GeocodingResult | undefined> {
  const direct = await geocodeOnce(location);
  if (direct) return direct;

  // The geocoder matches a bare place name well but often returns nothing
  // for "City, Region"/"City, Country" — exactly the format models tend to
  // pass. Fall back to just the part before the first comma.
  const commaIndex = location.indexOf(",");
  if (commaIndex === -1) return undefined;
  return geocodeOnce(location.slice(0, commaIndex).trim());
}

const parameters = z.object({
  location: z
    .string()
    .describe('A city name, optionally with region/country, e.g. "Austin, TX" or "Paris, France".'),
});

export const weatherTool: ITool<z.infer<typeof parameters>> = {
  name: "get_weather",
  description: "Gets the current weather conditions (temperature, wind, conditions) for a place.",
  parameters,
  async execute({ location }) {
    const place = await geocodeLocation(location);
    if (!place) {
      return `Could not find a location matching "${location}".`;
    }

    const url =
      `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
      "&temperature_unit=celsius&wind_speed_unit=kmh";
    const forecast = await fetchJson<ForecastResponse>(url);
    const current = forecast.current;
    if (!current) {
      return `Weather data is unavailable for ${place.name} right now.`;
    }

    const region = [place.admin1, place.country].filter(Boolean).join(", ");
    const placeLabel = region ? `${place.name}, ${region}` : place.name;

    return (
      `Current weather in ${placeLabel}: ${describeWeatherCode(current.weather_code)}, ` +
      `${current.temperature_2m}°C (feels like ${current.apparent_temperature}°C), ` +
      `${current.relative_humidity_2m}% humidity, wind ${current.wind_speed_10m} km/h.`
    );
  },
};
