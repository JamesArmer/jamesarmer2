var sp_consent = localStorage.getItem("sp_consent");
var sp_cookie_consent = localStorage.getItem("sp_cookie_consent");
var sp_vppa_consent = localStorage.getItem("sp_vppa_consent");
var urlParams = new URLSearchParams(window.location.search);
var hasVppa = urlParams.has("vppa");

// App IDs
var COOKIE_CONSENT_APP_ID = "65c9c0308f0e5c2b5f304d52";
var VPPA_CONSENT_APP_ID = "685e4eac9e69a046b16ab9cc";

function loadSPScript(appId) {
  var script = document.createElement("script");
  script.src = "https://frontend-test.secureprivacy.ai/script/" + appId + ".js";
  script.async = true;
  document.head.appendChild(script);
}

window.reloadSPScript = function (appId, localStorageKey, isPreferenceCenter = false) {
  // remove the sp_consent from local storage
  localStorage.removeItem("sp_consent");

  let sp_dynamic = JSON.parse(localStorage.getItem("sp_dynamic"));
  if (isPreferenceCenter) {
    // restore consent for the preference center
    let sp_consent = localStorage.getItem(localStorageKey);
    if (!!sp_dynamic && !!sp_consent) {
      sp_dynamic.saved = true;
      sp_dynamic.data.subConsents = JSON.parse(sp_consent);
      localStorage.setItem("sp_dynamic", JSON.stringify(sp_dynamic));
    }

  } else {
    // remove the sp_dynamic cache to load the banner
    if (!!sp_dynamic) {
      sp_dynamic.saved = false;
      sp_dynamic.data.subConsents = [];
      localStorage.setItem("sp_dynamic", JSON.stringify(sp_dynamic));
    }
  }

  // change the script loaded with the appId
  window.securePrivacy = { appId };

  // Remove existing SP scripts to force a full reinitialisation.
  // Without this, the previously loaded SP instance stays active in memory
  // and won't show a new banner even though localStorage has been reset.
  const existingScripts = document.querySelectorAll(
    'script[src*="secureprivacy.ai"]'
  );
  existingScripts.forEach(function (s) {
    s.parentNode.removeChild(s);
  });

  // Load a fresh SP script with the new appId
  loadSPScript(appId);

  // add event listener to store the consent in local storage
  window.addEventListener("sp_cookie_banner_save", function () {
    waitForLocalStorageConsents(function (allGivenConsents) {
      localStorage.setItem(localStorageKey, allGivenConsents);
    });
  }, { once: true });
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

// Helper function to wait for sp to be available
function waitForSp(callback) {
  const interval = setInterval(() => {
    if (
      typeof sp !== "undefined" &&
      typeof sp.openPreferenceCenter === "function"
    ) {
      clearInterval(interval);
      callback();
    }
  }, 100);
}

// Load the initial cookie consent script if no cookie consent yet
if (!sp_cookie_consent) {
  loadSPScript(COOKIE_CONSENT_APP_ID);

  window.addEventListener("sp_cookie_banner_save", function () {
    waitForLocalStorageConsents(function (allGivenConsents) {
      // store the cookie consents in local storage
      localStorage.setItem("sp_cookie_consent", allGivenConsents);

      // check if cookie consent has already been set and we are on a vppa page
      if (hasVppa && !sp_vppa_consent) {
        window.reloadSPScript(VPPA_CONSENT_APP_ID, "sp_vppa_consent", false);
      }
    });
  }, { once: true });
}

// check if cookie consent has already been set and we are on a vppa page
if (hasVppa && sp_cookie_consent && !sp_vppa_consent) {
  window.reloadSPScript(VPPA_CONSENT_APP_ID, "sp_vppa_consent", false);
}

// set the banner to the cookie script to prevent the banner from showing again
if (sp_cookie_consent && sp_vppa_consent) {
  if (sp_consent != sp_cookie_consent) {
    window.reloadSPScript(
      COOKIE_CONSENT_APP_ID,
      "sp_cookie_consent",
      true
    );
  }
}
