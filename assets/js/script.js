document.addEventListener('DOMContentLoaded', () => {

  // Variables for DOM objects and API key:

  const apiKey = '8fe03a2524c81c60a6d62aeb74979f88';
  const cityForm = document.getElementById('city-form');
  const cityInput = document.getElementById('city-input');
  const searchHistory = document.getElementById('search-history');
  const clearHistoryBtn = document.getElementById('clear-history');
  const currentWeather = document.getElementById('current-weather');
  const forecast = document.getElementById('forecast');

  // Search history from local storage; empty array if none:

  let history = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];

  function showLoadingSpinner() {
    document.getElementById('loading-spinner').classList.remove('hidden');
  }

  function hideLoadingSpinner() {
    document.getElementById('loading-spinner').classList.add('hidden');
  }

  // Form submission:

  cityForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = cityInput.value.trim();
    if (input) {
      showLoadingSpinner();
      try {
        await fetchWeather(input);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        cityInput.value = '';
      }
    }
  });

  // Fetch weather data:
  
  async function fetchWeather(input) {
    try {
      const location = await getLocation(input);
      if (!location) {
        alert('Location not found');
        hideLoadingSpinner();
        return;
      }

      const { lat, lon, name } = location;
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
      const weatherData = await weatherResponse.json();

      displayCurrentWeather(name, weatherData);
      displayForecast(weatherData);
      
      hideLoadingSpinner();

      if (!history.includes(name)) {
        history.push(name);
        localStorage.setItem('weatherSearchHistory', JSON.stringify(history));
        updateSearchHistory();
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      hideLoadingSpinner();
    }
  }

  // Get location data:

  async function getLocation(input) {
    let geoResponse, geoData;

    // Regex to verify if input is a valid location:

    if (/^\d{5}$/.test(input)) { // Zip code
      geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/zip?zip=${input},US&appid=${apiKey}`);
      geoData = await geoResponse.json();
      if (geoData && geoData.lat && geoData.lon) {
        return {
          lat: geoData.lat,
          lon: geoData.lon,
          name: input
        };
      }
    } else if (/^[a-zA-Z\s]+,\s*[a-zA-Z\s]+$/.test(input)) { // City, State
      const [city, state] = input.split(',').map(s => s.trim());
      geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city},${state},US&limit=1&appid=${apiKey}`);
      geoData = await geoResponse.json();
    } else { // City
      geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=1&appid=${apiKey}`);
      geoData = await geoResponse.json();
    }

    // Return location data if found:

    if (geoData.length && geoData[0].lat && geoData[0].lon) {
      const location = geoData[0];
      return {
        lat: location.lat,
        lon: location.lon,
        name: location.name || input
      };
    } else {
      return null;
    }
  }

  // Display current weather data:

  function displayCurrentWeather(city, data) {
    const current = data.list[0];
    const weatherHtml = `
      <div class="weather-card">
        <h2>${city} (${new Date(current.dt * 1000).toLocaleDateString()})</h2>
        <p><strong>Temp:</strong> ${current.main.temp}°F</p>
        <p><strong>Wind:</strong> ${current.wind.speed} MPH</p>
        <p><strong>Humidity:</strong> ${current.main.humidity} %</p>
        <img src="https://openweathermap.org/img/wn/${current.weather[0].icon}.png" alt="${current.weather[0].description}">
      </div>
    `;
    currentWeather.innerHTML = weatherHtml;
  }

  // Display 5-day forecast data:

  function displayForecast(data) {
    forecast.innerHTML = '<h2>5-Day Forecast:</h2>';
    const forecastHtml = data.list
      .filter((_, index) => index % 8 === 0)
      .map(forecast => `
        <div class="forecast-card">
          <h3>${new Date(forecast.dt * 1000).toLocaleDateString()}</h3>
          <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">
          <p><strong>Temp:</strong> ${forecast.main.temp} °F</p>
          <p><strong>Wind:</strong> ${forecast.wind.speed} MPH</p>
          <p><strong>Humidity:</strong> ${forecast.main.humidity} %</p>
        </div>
      `).join('');
    forecast.innerHTML += forecastHtml;
  }

  function updateSearchHistory() {
    searchHistory.innerHTML = history.map(city => `<button class="history-btn">${city}</button>`).join('');
    clearHistoryBtn.classList.toggle('hidden', history.length === 0);
  }
  
  searchHistory.addEventListener('click', (event) => {
    if (event.target.classList.contains('history-btn')) {
      fetchWeather(event.target.textContent);
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('weatherSearchHistory');
    history = [];
    updateSearchHistory();
  });

  updateSearchHistory();
});
