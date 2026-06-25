export class TaskService {
  constructor(weatherApi) {
    this.weatherApi = weatherApi;
    this.tasks = [];
    this.nextId = 1;
  }

  async create({ title, city }) {
    if (!title) throw new Error("TITLE_REQUIRED");
    const weather = await this.weatherApi.forecast(city);
    const task = { id: this.nextId++, title, city, temp: weather.temp };
    this.tasks.push(task);
    return task;
  }

  list() {
    return this.tasks;
  }
}
