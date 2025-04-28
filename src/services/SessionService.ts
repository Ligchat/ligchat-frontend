class SessionService {
  private static readonly TOKEN_KEY = '@ligchat/token';
  private static readonly USER_KEY = '@ligchat/user';
  private static readonly SECTOR_KEY = '@ligchat/sector';
  private static readonly SECTOR_OFFICIAL_KEY = '@ligchat/sector_official';
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
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return true;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
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
      const value = localStorage.getItem(key);
      if (!value) return null;
      try {
          return JSON.parse(value);
      } catch {
          return null;
      }
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

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): any | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static setAvailableSectors(sectors: number[]) {
    localStorage.setItem(this.AVAILABLE_SECTORS_KEY, JSON.stringify(sectors));
  }

  static getAvailableSectors(): number[] {
    const sectors = localStorage.getItem(this.AVAILABLE_SECTORS_KEY);
    return sectors ? JSON.parse(sectors) : [];
  }

  static setSectorId(sectorId: number, isOfficial: boolean) {
    // Validar e converter os valores
    if (!sectorId || typeof sectorId !== 'number') {
      console.error('Invalid sectorId:', sectorId);
      return;
    }

    const officialValue = Boolean(isOfficial);
    
    // Verificar se o setor atual é diferente do novo
    const currentSectorId = this.getSectorId();
    const currentIsOfficial = this.getSectorIsOfficial();
    
    if (currentSectorId === sectorId && currentIsOfficial === officialValue) {
      return; // Se for o mesmo setor e mesmo status, não faz nada
    }
    
    // Salvar os valores
    localStorage.setItem(this.SECTOR_KEY, sectorId.toString());
    localStorage.setItem(this.SECTOR_OFFICIAL_KEY, officialValue.toString());
    
    // Atualizar setores disponíveis se necessário
    const availableSectors = this.getAvailableSectors();
    if (!availableSectors.includes(sectorId)) {
      this.setAvailableSectors([...availableSectors, sectorId]);
    }
    
    // Disparar evento de mudança apenas se houve mudança real
    const event = new CustomEvent('sectorChanged', { 
      detail: { sectorId, isOfficial: officialValue } 
    });
    window.dispatchEvent(event);
  }

  static getSectorId(): number | null {
    const sectorId = localStorage.getItem(this.SECTOR_KEY);
    if (!sectorId) return null;

    try {
      const parsedId = parseInt(sectorId);
      if (isNaN(parsedId)) return null;
      return parsedId;
    } catch {
      return null;
    }
  }

  static getSectorIsOfficial(): boolean | null {
    const isOfficial = localStorage.getItem(this.SECTOR_OFFICIAL_KEY);
    if (!isOfficial) return null;

    try {
      return isOfficial === 'true';
    } catch {
      return null;
    }
  }

  static removeSectorId() {
    localStorage.removeItem(this.SECTOR_KEY);
    localStorage.removeItem(this.SECTOR_OFFICIAL_KEY);
    
    const event = new CustomEvent('sectorChanged', { 
      detail: { sectorId: null, isOfficial: null } 
    });
    window.dispatchEvent(event);
  }

  static validateAndCleanSectorSession(availableSectors: number[]) {
    if (!Array.isArray(availableSectors)) {
      console.error('Invalid availableSectors:', availableSectors);
      return;
    }

    this.setAvailableSectors(availableSectors);
    const currentSectorId = this.getSectorId();
    
    if (currentSectorId && !availableSectors.includes(currentSectorId)) {
      console.log('Current sector not in available sectors, removing...', {
        currentSectorId,
        availableSectors
      });
      this.removeSectorId();
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    return !this.isTokenExpired(token);
  }

  static clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SECTOR_KEY);
    localStorage.removeItem(this.SECTOR_OFFICIAL_KEY);
    localStorage.removeItem(this.AVAILABLE_SECTORS_KEY);
  }

  static setIsAnonymous(isAnonymous: boolean) {
    localStorage.setItem('@ligchat/is_anonymous', JSON.stringify(isAnonymous));
  }

  static getIsAnonymous(): boolean {
    const value = localStorage.getItem('@ligchat/is_anonymous');
    return value ? JSON.parse(value) : false;
  }
}

export default SessionService;
