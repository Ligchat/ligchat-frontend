class SessionService {
  private static readonly TOKEN_KEY = '@ligchat/token';
  private static readonly USER_KEY = '@ligchat/user';
  private static readonly SECTOR_KEY = '@ligchat/sector';
  private static readonly AVAILABLE_SECTORS_KEY = '@ligchat/available_sectors';

  // Salva um valor na sessão
  static setSession(key: string, value: any): void {
      localStorage.setItem(key, JSON.stringify(value));
  }

  // Decodifica um token JWT
  static decodeToken(token: string): any | null {
      try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
              atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
          );
          return JSON.parse(jsonPayload);
      } catch (error) {
          console.error('Failed to decode token:', error);
          return null;
      }
  }

  static isTokenExpired(token: string): boolean {
    const decodedToken = this.decodeToken(token);
    
    // Caso o token não possua informação de expiração, considera expirado
    if (!decodedToken || !decodedToken.exp) {
        return true;
    }

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTimeInSeconds;
}

  // Recupera um item da sessão para o setor
  static getSessionForSector(): any | null {
      const sessionData = localStorage.getItem("selectedSector");
      if (!sessionData) {
          return null;
      }

      return JSON.parse(sessionData); // Retorna qualquer tipo
  }

  // Limpa a sessão do setor
  static clearSectorSession(): void {
      this.removeSession("selectedSector");
  }

  // Recupera um item específico da sessão
  static getSession(key: string): any | null {
      const sessionData = localStorage.getItem(key);
      if (!sessionData) {
          return null;
      }

      const parsedData = JSON.parse(sessionData);
      
      // Retorna qualquer tipo, não apenas tokens
      return parsedData;
  }

  // Remove um item específico da sessão
  static removeSession(key: string): void {
      localStorage.removeItem(key);
  }

  // Limpa toda a sessão armazenada
  static clearAllSessions(): void {
      localStorage.clear();
  }

  // Verifica se uma sessão específica está expirada
  static isSessionExpired(key: string): boolean {
      const sessionData = localStorage.getItem(key);
      if (!sessionData) {
          return true;
      }

      const parsedData = JSON.parse(sessionData);
      const token = parsedData;

      if (!token) {
          return true;
      }

      const decodedToken = this.decodeToken(token);
      if (!decodedToken || !decodedToken.exp) {
          return true;
      }

      const currentTimeInSeconds = Math.floor(new Date().getTime() / 1000);
      return decodedToken.exp < currentTimeInSeconds;
  }

  static setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static setUser(user: any) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static removeUser() {
    localStorage.removeItem(this.USER_KEY);
  }

  static setAvailableSectors(sectors: number[]) {
    localStorage.setItem(this.AVAILABLE_SECTORS_KEY, JSON.stringify(sectors));
  }

  static getAvailableSectors(): number[] {
    const sectors = localStorage.getItem(this.AVAILABLE_SECTORS_KEY);
    return sectors ? JSON.parse(sectors) : [];
  }

  static setSectorId(sectorId: number) {
    const availableSectors = this.getAvailableSectors();
    
    if (!availableSectors.includes(sectorId)) {
      this.removeSectorId();
      return;
    }
    
    localStorage.setItem(this.SECTOR_KEY, sectorId.toString());
    
    // Dispara um evento custom para notificar sobre a mudança do setor
    const event = new CustomEvent('sectorChanged', { 
      detail: { sectorId } 
    });
    window.dispatchEvent(event);
  }

  static getSectorId(): number | null {
    const sectorId = localStorage.getItem(this.SECTOR_KEY);
    if (!sectorId) return null;

    const parsedId = parseInt(sectorId);
    const availableSectors = this.getAvailableSectors();

    if (!availableSectors.includes(parsedId)) {
      this.removeSectorId();
      return null;
    }

    return parsedId;
  }

  static removeSectorId() {
    localStorage.removeItem(this.SECTOR_KEY);
    
    // Dispara um evento custom para notificar sobre a remoção do setor
    const event = new CustomEvent('sectorChanged', { 
      detail: { sectorId: null } 
    });
    window.dispatchEvent(event);
  }

  static validateAndCleanSectorSession(availableSectors: number[]) {
    this.setAvailableSectors(availableSectors);
    const currentSectorId = this.getSectorId();
    
    if (currentSectorId && !availableSectors.includes(currentSectorId)) {
      this.removeSectorId();
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    return !this.isTokenExpired(token);
  }

  static clearSession() {
    this.removeToken();
    this.removeUser();
    this.removeSectorId();
    localStorage.removeItem(this.AVAILABLE_SECTORS_KEY);
  }
}

export default SessionService;
