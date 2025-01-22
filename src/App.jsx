import { useState, useEffect } from "react"
import axios from "axios"
import { Toaster, toast } from "react-hot-toast"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import WeatherCard from "./components/WeatherCard"
import WeatherGraph from "./components/WeatherGraph"
import Forecast from "./components/Forecast"
import TodaysHighlights from "./components/TodaysHighlights"
import OtherCities from "./components/OtherCities"
import "./App.css"

const API_KEY = "64a50d98c543deaa3972d08a76c4a050"
const BASE_URL = "https://api.openweathermap.org/data/2.5"

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    // Initial load with a default city
    handleSearch("London")
  }, [])

  const handleSearch = async (city) => {
    setLoading(true)
    try {
      const weatherResponse = await axios.get(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`)
      setWeather(weatherResponse.data)

      const forecastResponse = await axios.get(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`)

      const dailyData = forecastResponse.data.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000).toDateString()
        if (!acc[date]) {
          acc[date] = {
            date: item.dt * 1000,
            maxTemp: item.main.temp_max,
            minTemp: item.main.temp_min,
            condition: item.weather[0].main,
          }
        } else {
          acc[date].maxTemp = Math.max(acc[date].maxTemp, item.main.temp_max)
          acc[date].minTemp = Math.min(acc[date].minTemp, item.main.temp_min)
        }
        return acc
      }, {})

      setForecast(Object.values(dailyData).slice(0, 3))
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message)
      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`)
      } else {
        toast.error("Error fetching weather data. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const graphData = weather
    ? Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        temp: Math.round(weather.main.temp + Math.sin(i / 4) * 2),
      }))
    : []

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          searchCity={searchCity}
          setSearchCity={setSearchCity}
          handleSearch={() => handleSearch(searchCity)}
          toggleSidebar={toggleSidebar}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeatherCard weather={weather} loading={loading} />
              <OtherCities loading={loading} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TodaysHighlights weather={weather} loading={loading} />
              <Forecast forecast={forecast} loading={loading} />
            </div>
            <WeatherGraph data={graphData} loading={loading} />
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}

export default App

