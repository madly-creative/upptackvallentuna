/* Nyhetsbrev: gör varje <form data-nyhetsbrev> levande (startsidan, Om, /nyhetsbrev.html).
   Skickar till /.netlify/functions/subscribe (Brevo, double opt-in) och mäter i Umami via ut.js:
   action submit_newsletter {item: sektion}, action newsletter_error {item: felkod},
   action newsletter_confirmed när någon landar på /nyhetsbrev.html?bekraftad=1. */
(function () {
  "use strict";
  var ENDPOINT = "/.netlify/functions/subscribe";
  var MSG = {
    ok: "Tack! Kolla din inkorg och klicka på länken i mejlet, annars kommer inga tips. Hittar du det inte, titta i skräpposten.",
    invalid_email: "Den adressen ser inte riktigt rätt ut. Prova igen?",
    not_configured: "Utskicken är inte riktigt igång än. Prova gärna igen om några dagar.",
    fail: "Något krånglade på vägen. Prova igen om en stund.",
  };

  function act(type, item) {
    try { if (window.ut) window.ut.action(type, item); } catch (e) {}
  }

  function setState(form, state, text) {
    form.setAttribute("data-state", state);
    var status = form.querySelector(".letter-status");
    if (status) status.textContent = text || "";
  }

  function wire(form) {
    if (form.__letter) return;
    form.__letter = true;
    var host = form.closest("[data-sec]");
    var sec = (host && host.getAttribute("data-sec")) || "nyhetsbrev";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.getAttribute("data-state") === "sending") return;
      var input = form.querySelector('input[type="email"]');
      var email = (input && input.value || "").trim();
      if (!input || !input.checkValidity() || !email) {
        setState(form, "error", MSG.invalid_email);
        if (input) input.focus();
        return;
      }
      var hp = form.querySelector('input[name="website"]');
      setState(form, "sending", "Skickar …");
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, sec: sec, website: hp ? hp.value : "" }),
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok && res.d.ok) {
            setState(form, "done", MSG.ok);
            act("submit_newsletter", sec);
            return;
          }
          var code = res.d.error || "fail";
          setState(form, "error", MSG[code] || MSG.fail);
          act("newsletter_error", code);
        })
        .catch(function () {
          setState(form, "error", MSG.fail);
          act("newsletter_error", "network");
        });
    });
  }

  function init() {
    var forms = document.querySelectorAll("form[data-nyhetsbrev]");
    for (var i = 0; i < forms.length; i++) wire(forms[i]);
    if (/[?&]bekraftad=1\b/.test(location.search)) {
      document.documentElement.classList.add("letter-confirmed");
      act("newsletter_confirmed", "");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
