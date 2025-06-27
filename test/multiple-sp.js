var sp_consent = localStorage.getItem("sp_consent");
var sp_cookie_consent = localStorage.getItem("sp_cookie_consent");
var sp_vppa_consent = localStorage.getItem("sp_vppa_consent");
var urlParams = new URLSearchParams(window.location.search);
var hasVppa = urlParams.has("vppa");

if (!sp_cookie_consent) {
  window.addEventListener("sp_cookie_banner_save", function (evt) {
    waitForLocalStorageConsents(function (allGivenConsents) {
      // store the cookie consents in local storage
      localStorage.setItem("sp_cookie_consent", allGivenConsents);

      // check if cookie consent has already been set and we are on a vppa page
      if (hasVppa) {
        reloadSPScript("685e4eac9e69a046b16ab9cc", "sp_vppa_consent");
      }
    });
  });
}

// check if cookie consent has already been set and we are on a vppa page
if (hasVppa && sp_cookie_consent && !sp_vppa_consent) {
  reloadSPScript("685e4eac9e69a046b16ab9cc", "sp_vppa_consent");
}

function waitForLocalStorageConsents(callback) {
  const interval = setInterval(() => {
    let sp_consent = localStorage.getItem("sp_consent");
    if (sp_consent) {
      clearInterval(interval);
      callback(sp_consent);
    }
  }, 100); // check every 100ms
}

window.reloadSPScript = function (appId, localStorageKey) {
  // remove the sp_consent from local storage
  localStorage.removeItem("sp_consent");

  // remove the sp_dynamic cache to load the banner
  let sp_dynamic = JSON.parse(localStorage.getItem("sp_dynamic"));
  if (!!sp_dynamic) {
    sp_dynamic.saved = false;
    sp_dynamic.data.subConsents = [];
    localStorage.setItem("sp_dynamic", JSON.stringify(sp_dynamic));
  }

  // change the script loaded with the appId
  window.securePrivacy.appId = appId;

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
      localStorage.setItem(localStorageKey, allGivenConsents);
    });
  });
}