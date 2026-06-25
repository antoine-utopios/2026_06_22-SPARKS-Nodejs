export class UserService {
  constructor(userRepository, geoApi) {
    this.userRepository = userRepository;
    this.geoApi = geoApi;
  }

  async getEnrichedUser(id) {
    this._cache ??= new Map();
    if (this._cache.has(id)) return this._cache.get(id);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    const location = await this.geoApi.locate(user.ip);
    const result = { ...user, country: location.country };
    this._cache.set(id, result);
    return result;
  }
}
