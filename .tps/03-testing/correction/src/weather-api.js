export class WeatherApi {
  async forecast(city) {
    return { city, temp: 20 };
  }
}
