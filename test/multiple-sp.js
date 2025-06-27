var sp_consent = localStorage.getItem("sp_consent");
var urlParams = new URLSearchParams(window.location.search);
var hasVppa = urlParams.has("vppa");

window.addEventListener("sp_cookie_banner_save", function (evt) {
  console.log(evt);

  // store the cookie consents in a global variable
  window.cookieConsents = sp.allGivenConsents;
  console.log(window.cookieConsents);
});

// check if cookie consent has already been set and we are on a vppa page
if (hasVppa && sp_consent && sp_consent.length > 2) {
  // change to vppa script
  window.securePrivacy.appId = "685e4eac9e69a046b16ab9cc";
  reloadSecurePrivacyScript();
}

function reloadSecurePrivacyScript() {
  // Remove existing script if present
  const existingScript = document.querySelector('script[src*="secure-privacy-v2.js"]');
  if (existingScript) {
    existingScript.parentNode.removeChild(existingScript);
  }

  // Create and append new script
  const script = document.createElement("script");
  script.src = "https://test-v2.secureprivacy.ai/secure-privacy-v2.js";
  script.async = true;
  document.head.appendChild(script);
}