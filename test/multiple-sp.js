var sp_consent = localStorage.getItem("sp_consent");
var sp_cookie_consent = localStorage.getItem("sp_cookie_consent");
var urlParams = new URLSearchParams(window.location.search);
var hasVppa = urlParams.has("vppa");

if (!sp_cookie_consent) {
  window.addEventListener("sp_cookie_banner_save", function (evt) {
    waitForLocalStorageConsents(function (allGivenConsents) {
      // store the cookie consents in local storage
      localStorage.setItem("sp_cookie_consent", allGivenConsents);

      // check if cookie consent has already been set and we are on a vppa page
      if (hasVppa) {
        reloadVppaScript();
      }
    });
  });
}

// check if cookie consent has already been set and we are on a vppa page
if (hasVppa && sp_cookie_consent) {
  reloadVppaScript();
}

function waitForLocalStorageConsents(callback) {
  const interval = setInterval(() => {
    let sp_consent = localStorage.getItem("sp_consent");
    if (sp_consent && sp_consent.startsWith('[{"ClientId":')) {
      clearInterval(interval);
      callback(sp_consent);
    }
  }, 100); // check every 100ms
}

function reloadVppaScript() {
  // remove the sp_consent from local storage
  localStorage.removeItem("sp_consent");

  // change to vppa script
  window.securePrivacy.appId = "685e4eac9e69a046b16ab9cc";

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

  // add event listener to store the vppa consent in local storage
  window.addEventListener("sp_cookie_banner_save", function (evt) {
    waitForLocalStorageConsents(function (allGivenConsents) {
      localStorage.setItem("sp_vppa_consent", allGivenConsents);
    });
  });
}