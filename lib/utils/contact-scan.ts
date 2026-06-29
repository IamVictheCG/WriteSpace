const PHONE_PATTERNS = [
  /\+?(\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  /0[7-9][0-1]\d{8}/g, // Nigerian phone numbers
]

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

const CONTACT_PHRASES = [
  'whatsapp',
  'call me',
  'text me',
  'my number',
  'my email',
  'reach me at',
  'contact me',
  'send me a mail',
  'dm me on',
  'hit me up on',
  'my ig is',
  'my twitter',
  'my instagram',
  'telegram',
]

export function scanForContactInfo(text: string): { flagged: boolean; matchedPattern: string | null } {
  const lower = text.toLowerCase()

  for (const pattern of PHONE_PATTERNS) {
    pattern.lastIndex = 0
    if (pattern.test(text)) {
      return { flagged: true, matchedPattern: 'phone_number' }
    }
  }

  if (EMAIL_PATTERN.test(text)) {
    return { flagged: true, matchedPattern: 'email_address' }
  }

  for (const phrase of CONTACT_PHRASES) {
    if (lower.includes(phrase)) {
      return { flagged: true, matchedPattern: `contact_phrase:${phrase}` }
    }
  }

  return { flagged: false, matchedPattern: null }
}
