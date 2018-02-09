function checkLicense(licenseKey) {

//  licenseKey= '16719283-37D74362-BB167A69-EAC01063'; 
//  licenseKey= 'A4BB775A-C0A94008-A665CC1D-5AE97928';
    var url = "https://api.gumroad.com/v2/licenses/verify";
    var data = {
        'product_permalink': 'qCBNE',
        'license_key': licenseKey
    };
    var options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(data)
    };
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code == 200) {
        var content = JSON.parse(response.getContentText());
        if (content.success) {
            setFBData(content.purchase.email, content.purchase.variants);
            Logger.log( content );
            onOpen();
            return content;
        }
    } else {
        throw new Error(code);
    }
}

function saveLicenseKeyForUser(key){
  var user = getActiveUserEmail();
  var sheet = SpreadsheetApp
  .openByUrl("https://docs.google.com/spreadsheets/d/1atAvHlCBdwrTE85_QIHzNZmpjF8RFXqVIml4PP6pF0c/edit?usp=sharing")
  .getSheetByName("Users");
  
}