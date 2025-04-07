interface SendFileParams {
  base64File: string;
  mediaType: string;
  fileName: string;
  caption: string;
  recipient: string;
  contactId: number;
  sectorId: number;
}

interface SendFileResponse {
  id: number;
  status: string;
}

export const sendFile = async (params: SendFileParams): Promise<SendFileResponse> => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/send-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to send file');
  }

  return response.json();
}; 