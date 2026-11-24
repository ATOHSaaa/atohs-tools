/* Google Analytics 4 — tools.atohs.me */
const GA_MEASUREMENT_ID = "G-XEYB41P03T";

window.dataLayer = window.dataLayer || [];

function gtag() {
  dataLayer.push(arguments);
}

window.gtag = gtag;
gtag("js", new Date());
gtag("config", GA_MEASUREMENT_ID);