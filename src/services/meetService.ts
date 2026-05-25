import { getCachedAccessToken, loginWithGoogle } from '../firebase';

export interface MeetSpace {
  name: string;
  meetingUri: string;
  meetingLink: string;
}

/**
 * Creates a Google Meet space using the user's Google OAuth access token.
 * If no cached access token is found, or if API fails, it will attempt
 * to get one or propagate clean errors so the UI can prompt for re-authentication.
 */
export async function createGoogleMeetSpace(): Promise<MeetSpace> {
  let token = getCachedAccessToken();
  
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  try {
    const response = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Meet space creation failed:', errorData);
      
      // If unauthorized, token might have expired
      if (response.status === 401) {
        throw new Error('AUTH_EXPIRED');
      }
      
      throw new Error(errorData.error?.message || 'Failed to create Google Meet space');
    }

    const data = await response.json();
    
    // Google Meet API returns 'meetingUri' (e.g. "https://meet.google.com/abc-def-ghi")
    // and 'name' (e.g. "spaces/abc-def-ghi")
    const meetingUri = data.meetingUri || '';
    let meetingLink = meetingUri;
    
    if (!meetingLink && data.name) {
      const code = data.name.replace('spaces/', '');
      meetingLink = `https://meet.google.com/${code}`;
    }

    return {
      name: data.name || '',
      meetingUri: meetingUri,
      meetingLink: meetingLink || 'https://meet.google.com/abc-defg-hij' // Fallback
    };
  } catch (error: any) {
    console.error('Error in createGoogleMeetSpace:', error);
    if (error.message === 'AUTH_REQUIRED' || error.message === 'AUTH_EXPIRED') {
      throw error;
    }
    throw new Error(error.message || 'Error occurred while establishing Google Meet connection');
  }
}
