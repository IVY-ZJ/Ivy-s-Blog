// Pre-seed a valid login session so guarded pages render for screenshots.
(function () {
  try {
    localStorage.setItem("ivy-session", JSON.stringify({
      username: "Ivy",
      email: "ivyzj2000@gmail.com",
      hash: "demo",
      loggedAt: Date.now(),
      verified: true
    }));
  } catch (e) {}
})();
