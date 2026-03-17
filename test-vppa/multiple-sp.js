var sp_consent = localStorage.getItem("sp_consent");
var sp_cookie_consent = localStorage.getItem("sp_cookie_consent");
var sp_vppa_consent = localStorage.getItem("sp_vppa_consent");
var urlParams = new URLSearchParams(window.location.search);
var hasVppa = urlParams.has("vppa");

// App IDs
var COOKIE_CONSENT_APP_ID = "65c9c0308f0e5c2b5f304d52";
var VPPA_CONSENT_APP_ID = "685e4eac9e69a046b16ab9cc";

console.log("[SP] Init state:", {
  sp_consent: sp_consent,
  sp_cookie_consent: sp_cookie_consent,
  sp_vppa_consent: sp_vppa_consent,
  hasVppa: hasVppa,
  "window.securePrivacy": window.securePrivacy,
  "window.sp": window.sp,
});

function loadSPScript(appId) {
  var scriptUrl = "https://frontend-test.secureprivacy.ai/script/" + appId + ".js";
  console.log("[SP] loadSPScript: injecting", scriptUrl);
  var script = document.createElement("script");
  script.src = scriptUrl;
  script.async = true;
  script.onload = function () {
    console.log("[SP] loadSPScript: loaded successfully", appId);
    console.log("[SP] loadSPScript: window.securePrivacy =", window.securePrivacy);
    console.log("[SP] loadSPScript: window.sp =", window.sp);
  };
  script.onerror = function (err) {
    console.error("[SP] loadSPScript: FAILED to load", appId, err);
  };
  document.head.appendChild(script);
}

window.reloadSPScript = function (appId, localStorageKey, isPreferenceCenter = false) {
  console.log("[SP] reloadSPScript called:", { appId, localStorageKey, isPreferenceCenter });

  // remove the sp_consent from local storage
  localStorage.removeItem("sp_consent");

  let sp_dynamic = JSON.parse(localStorage.getItem("sp_dynamic"));
  console.log("[SP] reloadSPScript: sp_dynamic before modify:", JSON.stringify(sp_dynamic));

  if (isPreferenceCenter) {
    // restore consent for the preference center
    let sp_consent = localStorage.getItem(localStorageKey);
    if (!!sp_dynamic && !!sp_consent) {
      sp_dynamic.saved = true;
      sp_dynamic.data.subConsents = JSON.parse(sp_consent);
      localStorage.setItem("sp_dynamic", JSON.stringify(sp_dynamic));
      console.log("[SP] reloadSPScript: restored preference center consent");
    } else {
      console.log("[SP] reloadSPScript: skipped preference center restore — sp_dynamic:", !!sp_dynamic, "sp_consent:", !!sp_consent);
    }

  } else {
    // remove the sp_dynamic cache to load the banner
    if (!!sp_dynamic) {
      sp_dynamic.saved = false;
      sp_dynamic.data.subConsents = [];
      localStorage.setItem("sp_dynamic", JSON.stringify(sp_dynamic));
      console.log("[SP] reloadSPScript: reset sp_dynamic for fresh banner");
    } else {
      console.log("[SP] reloadSPScript: no sp_dynamic found to reset");
    }
  }

  // change the script loaded with the appId
  window.securePrivacy = { appId };
  console.log("[SP] reloadSPScript: set window.securePrivacy =", window.securePrivacy);

  // Remove existing SP scripts to force a full reinitialisation.
  // Without this, the previously loaded SP instance stays active in memory
  // and won't show a new banner even though localStorage has been reset.
  const existingScripts = document.querySelectorAll(
    'script[src*="secureprivacy.ai"]'
  );
  console.log("[SP] reloadSPScript: removing", existingScripts.length, "existing SP scripts");
  existingScripts.forEach(function (s) {
    console.log("[SP] reloadSPScript: removing script:", s.src);
    s.parentNode.removeChild(s);
  });

  // Load the core SP library directly (not the app-specific bootstrap script).
  // The app-specific script is only for initial page load — on reload, window.securePrivacy
  // already has the config so we just need the core library to reinitialise with it.
  var coreScriptUrl = "https://test-v2.secureprivacy.ai/secure-privacy-v2.js";
  console.log("[SP] reloadSPScript: loading core SP library:", coreScriptUrl);
  var script = document.createElement("script");
  script.src = coreScriptUrl;
  script.async = true;
  script.onload = function () {
    console.log("[SP] reloadSPScript: core library loaded");
    console.log("[SP] reloadSPScript: window.sp =", window.sp);
  };
  script.onerror = function (err) {
    console.error("[SP] reloadSPScript: FAILED to load core library", err);
  };
  document.head.appendChild(script);

  // add event listener to store the consent in local storage
  window.addEventListener("sp_cookie_banner_save", function () {
    console.log("[SP] sp_cookie_banner_save fired (from reloadSPScript listener)");
    waitForLocalStorageConsents(function (allGivenConsents) {
      localStorage.setItem(localStorageKey, allGivenConsents);
      console.log("[SP] stored consent in", localStorageKey);
    });
  }, { once: true });
}

function waitForLocalStorageConsents(callback) {
  console.log("[SP] waitForLocalStorageConsents: polling...");
  const interval = setInterval(() => {
    let sp_consent = localStorage.getItem("sp_consent");
    if (sp_consent) {
      clearInterval(interval);
      console.log("[SP] waitForLocalStorageConsents: found sp_consent");
      callback(sp_consent);
    }
  }, 100); // check every 100ms
}

// Helper function to wait for sp to be available
function waitForSp(callback) {
  console.log("[SP] waitForSp: polling...");
  const interval = setInterval(() => {
    if (
      typeof sp !== "undefined" &&
      typeof sp.openPreferenceCenter === "function"
    ) {
      clearInterval(interval);
      console.log("[SP] waitForSp: sp is available");
      callback();
    }
  }, 100);
}

// Load the initial cookie consent script if no cookie consent yet
if (!sp_cookie_consent) {
  console.log("[SP] No cookie consent — loading cookie consent script");
  loadSPScript(COOKIE_CONSENT_APP_ID);

  window.addEventListener("sp_cookie_banner_save", function () {
    console.log("[SP] sp_cookie_banner_save fired (from initial consent listener)");
    waitForLocalStorageConsents(function (allGivenConsents) {
      // store the cookie consents in local storage
      localStorage.setItem("sp_cookie_consent", allGivenConsents);
      console.log("[SP] stored sp_cookie_consent");

      // check if cookie consent has already been set and we are on a vppa page
      if (hasVppa && !sp_vppa_consent) {
        console.log("[SP] On VPPA page after cookie consent — reloading for VPPA");
        window.reloadSPScript(VPPA_CONSENT_APP_ID, "sp_vppa_consent", false);
      }
    });
  }, { once: true });
} else {
  console.log("[SP] Cookie consent already exists");
}

// check if cookie consent has already been set and we are on a vppa page
if (hasVppa && sp_cookie_consent && !sp_vppa_consent) {
  console.log("[SP] VPPA page with cookie consent but no VPPA consent — reloading for VPPA");
  window.reloadSPScript(VPPA_CONSENT_APP_ID, "sp_vppa_consent", false);
} else {
  console.log("[SP] VPPA reload check skipped:", { hasVppa, sp_cookie_consent: !!sp_cookie_consent, sp_vppa_consent: !!sp_vppa_consent });
}

// set the banner to the cookie script to prevent the banner from showing again
if (sp_cookie_consent && sp_vppa_consent) {
  if (sp_consent != sp_cookie_consent) {
    console.log("[SP] Both consents exist but sp_consent differs — restoring cookie consent script");
    window.reloadSPScript(
      COOKIE_CONSENT_APP_ID,
      "sp_cookie_consent",
      true
    );
  } else {
    console.log("[SP] Both consents exist and sp_consent matches — no action needed");
  }
} else {
  console.log("[SP] Both-consents check skipped:", { sp_cookie_consent: !!sp_cookie_consent, sp_vppa_consent: !!sp_vppa_consent });
}
