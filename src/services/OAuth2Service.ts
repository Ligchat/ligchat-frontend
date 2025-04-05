import { getSector, updateSector } from '../services/SectorService';
import SessionService from '../services/SessionService';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

declare global {
  interface Window {
    gapi: any; 
    google: any;
  }
}

export class OAuth2Service {
  private tokenClient: any;
  private googleClientId: string | null;
  private googleApiKey: string | null;
  private isAuthenticated: boolean;
  private accessToken: string | null;
  private refreshToken: string | null;
  private tokenExpiration: Date | null;

  constructor(googleClientId: string | null, googleApiKey: string | null) {
    this.googleClientId = googleClientId;
    this.googleApiKey = googleApiKey;
    this.isAuthenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiration = null;
    this.initOAuthClient();
  }

  private async initOAuthClient(): Promise<void> {
    console.log('Initializing OAuth client...');
    if (!this.googleClientId || !this.googleApiKey) {
      console.error('Google Client ID or API Key not provided.');
      return;
    }
  
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
  
    return new Promise<void>((resolve, reject) => {
      gisScript.onload = () => {
        if (window.google && window.google.accounts) {
          console.log('Google OAuth client library loaded successfully.');
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: this.googleClientId,
            scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/contacts',
            callback: this.handleAuthCallback.bind(this),
          });
          console.log('Token client initialized successfully.');
          resolve();
        } else {
          console.error('Google OAuth client library not loaded correctly.');
          reject(new Error('Google OAuth client library not loaded correctly.'));
        }
      };
      gisScript.onerror = () => {
        console.error('Error loading the Google OAuth script.');
        reject(new Error('Error loading the Google OAuth script.'));
      };
      document.body.appendChild(gisScript);
    });
  }
  



  public async handleAuthClick(): Promise<void> {
    if (!this.tokenClient) {
      console.error('Token client not initialized.');
      return;
    }
  
    console.log('Requesting access token...');
    try {
      const token = window.gapi && window.gapi.client ? window.gapi.client.getToken() : null;
      const prompt = token === null ? 'consent' : '';
      this.tokenClient.requestAccessToken({ prompt });
    } catch (error) {
      console.error('Error requesting access token:', error);
    }
  }
  
  private handleAuthCallback(resp: any): void {
    console.log('Auth callback called.');
    if (resp.error) {
      console.error('Error during authentication:', resp.error);
      return;
    }
  
    console.log('Authentication successful:', resp);
    this.isAuthenticated = true;
    this.accessToken = resp.access_token;
    this.refreshToken = resp.refresh_token;
    this.tokenExpiration = new Date(Date.now() + resp.expires_in * 1000);
    this.updateSectorAfterAuthentication();
  }

  private async updateSectorAfterAuthentication(): Promise<void> {
    const sectorId = SessionService.getSession('selectedSector');
    if (sectorId && this.accessToken && this.refreshToken && this.tokenExpiration) {
      try {
        const sector = await getSector(sectorId);
        if (sector) {
          const updateData = {
            oauth2AccessToken: this.accessToken,
            oauth2RefreshToken: this.refreshToken,
            oauth2TokenExpiration: this.tokenExpiration
          };
          await updateSector(sectorId, updateData);
          console.log('Sector updated with new tokens');
        } else {
          console.error('Sector data is not valid.');
        }
      } catch (error) {
        console.error('Error fetching or updating sector:', error);
      }
    }
  }

  public isAuthenticatedStatus(): boolean {
    return this.isAuthenticated;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }
}
