// Pre-set a fake Ivy session so the guard doesn't bounce to login.html
// Valid for 30 days from 2026-08-12
localStorage.setItem('ivy-session', JSON.stringify({
  username: 'Ivy',
  email: 'ivyzj2000@gmail.com',
  hash: 'demo-hash',
  loggedAt: Date.now(),
  verified: true
}));
