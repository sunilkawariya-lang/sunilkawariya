
import { Investment } from '../types';

export interface BrokerConfig {
  id: string;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
}

export const connectToBroker = async (brokerId: string): Promise<any> => {
  console.log(`Connecting to ${brokerId} via backend...`);
  
  try {
    // In a real implementation, this would involve:
    // 1. Fetching the OAuth URL from /api/auth/[broker]/url
    // 2. Opening a popup and waiting for OAUTH_AUTH_SUCCESS message
    // 3. Fetching holdings from /api/broker/[broker]/holdings
    
    if (brokerId === 'mfcentral') {
      // 1. Get Auth URL
      const authUrlResponse = await fetch(`/api/auth/mfcentral/url`);
      const { url } = await authUrlResponse.json();
      
      // 2. Open Popup and wait for success
      const authSuccess = await new Promise<boolean>((resolve) => {
        const authWindow = window.open(url, 'mfcentral_auth', 'width=600,height=700');
        
        if (!authWindow) {
          console.error('Popup blocked');
          resolve(false);
          return;
        }

        let resolved = false;
        
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.broker === 'mfcentral') {
            resolved = true;
            window.removeEventListener('message', handleMessage);
            resolve(true);
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Poll for window close if user cancels
        const pollTimer = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(pollTimer);
            setTimeout(() => {
              if (!resolved) {
                window.removeEventListener('message', handleMessage);
                resolve(false);
              }
            }, 500);
          }
        }, 1000);
      });
      
      if (!authSuccess) {
        throw new Error('Authentication cancelled or failed. Please ensure popups are allowed.');
      }
      
      // 3. Fetch Holdings from backend
      const response = await fetch(`/api/broker/mfcentral/holdings`);
      if (!response.ok) throw new Error('Failed to fetch holdings from MF Central');
      return await response.json();
    }

    if (['zerodha', 'groww', 'upstox', 'angelone'].includes(brokerId)) {
      const response = await fetch(`/api/broker/${brokerId}/holdings`);
      if (!response.ok) throw new Error(`Failed to fetch holdings from ${brokerId}`);
      return await response.json();
    }

    if (brokerId === 'aa') {
      const authUrlResponse = await fetch(`/api/auth/aa/url`);
      const { url } = await authUrlResponse.json();
      
      const authSuccess = await new Promise<boolean>((resolve) => {
        const authWindow = window.open(url, 'aa_auth', 'width=600,height=700');
        
        if (!authWindow) {
          resolve(false);
          return;
        }

        let resolved = false;

        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.broker === 'aa') {
            resolved = true;
            window.removeEventListener('message', handleMessage);
            resolve(true);
          }
        };
        window.addEventListener('message', handleMessage);
        
        const pollTimer = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(pollTimer);
            setTimeout(() => {
              if (!resolved) {
                window.removeEventListener('message', handleMessage);
                resolve(false);
              }
            }, 500);
          }
        }, 1000);
      });
      
      if (!authSuccess) throw new Error('Bank sync cancelled or failed. Please ensure popups are allowed.');
      
      const response = await fetch(`/api/broker/aa/data`);
      if (!response.ok) throw new Error('Failed to fetch bank data');
      return await response.json();
    }

    if (brokerId === 'insurance') {
      const authUrlResponse = await fetch(`/api/auth/insurance/url`);
      const { url } = await authUrlResponse.json();
      
      // For demo, we skip the actual popup wait for insurance if it's not fully implemented
      const response = await fetch(`/api/broker/insurance/policies`);
      if (!response.ok) throw new Error('Failed to fetch insurance policies');
      return await response.json();
    }

    if (brokerId === 'digigold') {
      const response = await fetch(`/api/broker/digigold/holdings`);
      if (!response.ok) throw new Error('Failed to fetch digigold holdings');
      return await response.json();
    }

    if (brokerId === 'epf') {
      const response = await fetch(`/api/broker/epf/balance`);
      if (!response.ok) throw new Error('Failed to fetch EPF balance');
      return await response.json();
    }

    // Fallback to mock for other brokers for now
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    switch (brokerId) {
      case 'zerodha':
        return [
          {
            id: `kite-${Date.now()}-1`,
            memberId: '',
            name: 'TATA MOTORS LTD',
            category: 'Equity',
            subCategory: 'Large Cap',
            currentValue: 45000,
            investedValue: 38000,
            symbol: 'TATAMOTORS.NS',
            quantity: 50,
            price: 900,
            lastUpdated: new Date().toISOString()
          },
          {
            id: `kite-${Date.now()}-2`,
            memberId: '',
            name: 'INFOSYS LTD',
            category: 'Equity',
            subCategory: 'Large Cap',
            currentValue: 32000,
            investedValue: 30000,
            symbol: 'INFY.NS',
            quantity: 20,
            price: 1600,
            lastUpdated: new Date().toISOString()
          }
        ];
      case 'groww':
        return [
          {
            id: `groww-${Date.now()}-1`,
            memberId: '',
            name: 'Parag Parikh Flexi Cap Fund',
            category: 'Hybrid',
            subCategory: 'Flexi Cap',
            currentValue: 125000,
            investedValue: 100000,
            schemeCode: '122639',
            lastUpdated: new Date().toISOString()
          }
        ];
      default:
        return [
          {
            id: `gen-${Date.now()}-1`,
            memberId: '',
            name: 'Sample Stock from ' + brokerId,
            category: 'Equity',
            subCategory: 'Large Cap',
            currentValue: 10000,
            investedValue: 9000,
            lastUpdated: new Date().toISOString()
          }
        ];
    }
  } catch (error) {
    console.error(`Error connecting to ${brokerId}:`, error);
    throw error;
  }
};
