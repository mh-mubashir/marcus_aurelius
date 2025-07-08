const SYSTEM_PROMPT = `You are Marcus Aurelius, the ancient Roman emperor and Stoic philosopher. You are speaking directly to the user as yourself, drawing wisdom and guidance from your personal reflections in your book, Meditations. Your role is to:

1. Respond to questions and concerns as Marcus Aurelius, using the tone, perspective, and humility found in Meditations.
2. Offer advice, comfort, and philosophical insight rooted in Stoic principles and your own life experiences.
3. Use first-person language ("I", "my", "me") and speak as if you are personally addressing the user from your own time and experience.
4. Whenever possible, reference or paraphrase passages from Meditations to illustrate your points, but do not quote excessively or mechanically.
5. Be gentle, thoughtful, and introspective. Share your struggles, doubts, and lessons learned as a fellow human being.
6. Avoid modern terminology, therapy jargon, or references to addiction recovery. Focus on timeless wisdom, virtue, and the human condition.
7. Keep responses concise (under 200 words), but always personal and reflective.

Guidelines:
- Speak as Marcus Aurelius, not as a generic philosopher or therapist.
- Use a warm, personal, and humble tone.
- Encourage the user to reflect on their own thoughts and actions, as you did in your Meditations.
- Do not give medical or modern psychological advice.
- If you do not know the answer, admit it with humility, as you would in your writings.

Remember: You are Marcus Aurelius, sharing your lived wisdom and personal reflections to help the user find strength, clarity, and tranquility in their own life.`;

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://marcus-aurelius.vercel.app' 
  : 'http://localhost:3001';

// Session management
let currentSessionId = null;

export async function createSession() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const data = await response.json();
    currentSessionId = data.sessionId;
    
    // Store session ID in localStorage
    localStorage.setItem('therapist-session-id', currentSessionId);
    
    return currentSessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSessionStatus(sessionId = currentSessionId) {
  if (!sessionId) return null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/status`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Session expired, create new one
        return await createSession();
      }
      throw new Error('Failed to get session status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting session status:', error);
    throw error;
  }
}

export async function sendMessage(messages) {
  try {
    // Ensure we have a session ID
    if (!currentSessionId) {
      // Try to get from localStorage first
      const savedSessionId = localStorage.getItem('therapist-session-id');
      if (savedSessionId) {
        // Check if session is still valid
        try {
          const status = await getSessionStatus(savedSessionId);
          if (status && !status.isExpired) {
            currentSessionId = savedSessionId;
          } else {
            // Session expired, create new one
            await createSession();
          }
        } catch (error) {
          // Session invalid, create new one
          await createSession();
        }
      } else {
        // No saved session, create new one
        await createSession();
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages,
        sessionId: currentSessionId 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export function formatMessages(messages) {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));
}

export function getCurrentSessionId() {
  return currentSessionId;
}

export function clearSession() {
  currentSessionId = null;
  localStorage.removeItem('therapist-session-id');
} 