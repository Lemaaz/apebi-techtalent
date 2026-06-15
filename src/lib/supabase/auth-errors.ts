const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'Email not confirmed': 'Confirmez votre email avant de vous connecter',
  'User already registered': 'Un compte existe déjà avec cet email',
  'Password should be at least': 'Le mot de passe doit contenir au moins 8 caractères',
  'over_email_send_rate_limit': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'Email rate limit exceeded': 'Trop de tentatives. Réessayez dans quelques minutes.',
}

export function translateAuthError(message: string): string {
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.includes(key)) return value
  }
  return 'Une erreur est survenue. Réessayez.'
}
