var sp_consent = localStorage.getItem("sp_consent");
var urlParams = new URLSearchParams(window.location.search);
var hasVppa = urlParams.has("vppa");

// check if cookie consent has already been set and we are on a vppa page
if (hasVppa && sp_consent && sp_consent.length > 0) {
  // inject vppa script
  var script = document.createElement("script");
  script.src =
    "https://frontend-test.secureprivacy.ai/script/685e4eac9e69a046b16ab9cc.js";
  document.head.appendChild(script);
} else {
  // inject default cookie script
  var script = document.createElement("script");
  script.src =
    "https://frontend-test.secureprivacy.ai/script/65c9c0308f0e5c2b5f304d52.js";
  document.head.appendChild(script);

  window.addEventListener("sp_cookie_banner_save", function (evt) {
    console.log(evt);

    // store the cookie consents in a global variable
    window.cookieConsents = sp.allGivenConsents;
    console.log(window.cookieConsents);

    if (hasVppa) {
      sp = null;
      // inject vppa script
      var script = document.createElement("script");
      script.src =
        "https://frontend-test.secureprivacy.ai/script/685e4eac9e69a046b16ab9cc.js";
      document.head.appendChild(script);
    }
  });
}