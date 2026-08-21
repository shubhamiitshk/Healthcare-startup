import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  if (req.method === 'GET') {
    const { patientId, clinicId } = req.query;
    let url = `${apiUrl}/follow-ups`;
    if (patientId) {
      url = `${apiUrl}/follow-ups/patient/${patientId}`;
    } else if (clinicId) {
      url = `${apiUrl}/follow-ups/clinic/${clinicId}`;
    }
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ message: data.message || 'Failed to fetch follow-ups' });
      }
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
