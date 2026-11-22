var RAI_FORM_ID = "1ZU0gQWyWCiUrSjutOuGEYbSDLfEgp2LIHU5fX8bB1U0";

/**
 * Install this as an Apps Script form-submit trigger owned by the Google Form owner.
 * Set the script properties RAI_WEBHOOK_URL and GOOGLE_FORM_WEBHOOK_SECRET before installing.
 */
function sendRaiStoreApplication(e) {
  if (!e || !e.response) throw new Error("Google Form submit event is missing.");

  var answers = {};
  e.response.getItemResponses().forEach(function (itemResponse) {
    answers[itemResponse.getItem().getTitle().trim().toLowerCase()] = String(itemResponse.getResponse() || "").trim();
  });

  var categoryText = answers["kategori usaha (kuliner, retail, jasa, klinik, lainnya)"] || "lainnya";
  var categoryMap = { "kuliner": "FNB", "retail": "RETAIL", "jasa": "SERVICE", "klinik": "CLINIC", "lainnya": "OTHER" };
  var planText = answers["paket layanan yang diminati"] || "RAI Laris";
  var planMap = { "rai laris": "LARIS", "rai kasir": "KASIR", "rai juragan": "JURAGAN" };
  var consent = answers["persetujuan penggunaan data"] || "";

  var payload = {
    businessName: answers["nama usaha / toko"] || "",
    ownerName: answers["nama pemilik usaha"] || "",
    ownerEmail: answers["email pemilik usaha"] || "",
    category: categoryMap[categoryText.toLowerCase()] || "OTHER",
    phoneWa: answers["nomor whatsapp pemilik usaha (628…)"] || "",
    address: answers["alamat lengkap toko"] || "",
    mapsUrl: answers["tautan google maps toko"] || "",
    googleReviewUrl: answers["link google review toko"] || "",
    planTier: planMap[planText.toLowerCase()] || "LARIS",
    staffName: answers["nama kasir (opsional)"] || "",
    staffEmail: answers["email kasir (opsional)"] || "",
    dataConsent: consent.toLowerCase() === "saya setuju"
  };

  var properties = PropertiesService.getScriptProperties();
  var endpoint = properties.getProperty("RAI_WEBHOOK_URL");
  var secret = properties.getProperty("GOOGLE_FORM_WEBHOOK_SECRET");
  if (!endpoint || !secret) throw new Error("Set RAI_WEBHOOK_URL and GOOGLE_FORM_WEBHOOK_SECRET in Script Properties.");

  var response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error("RAI application webhook returned HTTP " + response.getResponseCode() + ". Check the Apps Script execution log.");
  }
}

function installRaiFormTrigger() {
  var existing = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === "sendRaiStoreApplication";
  });
  if (!existing.length) {
    ScriptApp.newTrigger("sendRaiStoreApplication")
      .forForm(FormApp.openById(RAI_FORM_ID))
      .onFormSubmit()
      .create();
  }
}
