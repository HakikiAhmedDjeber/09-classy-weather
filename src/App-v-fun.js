import React, { useEffect, useState } from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

function App() {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});

  const handleInput = (e) => setLocation(e.target.value);

  useEffect(() => {
    setLocation(localStorage.getItem("location") || "");
  }, []);
  // useEffect[location]

  useEffect(() => {
    const getWeather = async () => {
      if (location.length < 2) return setWeather({});
      setIsLoading(true);
      try {
        // 1) Getting location (geocoding)
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
        );
        const geoData = await geoRes.json();
        console.log(geoData);

        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country_code } =
          geoData.results.at(0);

        console.log({ latitude, longitude, timezone, name, country_code });
        console.log(`${name} ${convertToFlag(country_code)}`);

        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

        // 2) Getting actual weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        console.log(weatherData.daily);
        setWeather(weatherData.daily);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    getWeather();
    localStorage.setItem("location", location);
  }, [location]);

  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <Input location={location} onLocationChange={handleInput} />
      {/* <input type="button" value="Get Weather" onClick={this.getWeather} /> */}
      {isLoading && <p className="loader">Loading...</p>}
      {weather.time && <Weather weather={weather} location={displayLocation} />}
    </div>
  );
}

export default App;

function Input({ location, onLocationChange }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Search from location ..."
        value={location}
        onChange={onLocationChange}
      />
    </div>
  );
}

function Weather({ weather, location }) {
  useEffect(() => {
    return console.log("Weather component unmount");
  }, []);

  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: date,
    weathercode: code,
  } = weather;

  return (
    <div>
      <h2>Weather {location}</h2>
      <ul className="weather">
        {date.map((ele, i) => (
          <Day
            max={max.at(i)}
            min={min.at(i)}
            date={ele}
            code={code.at(i)}
            isToday={i === 0}
            key={i}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ max, min, date, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}</strong>
      </p>
    </li>
  );
}
