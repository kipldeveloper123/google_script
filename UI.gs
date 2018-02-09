var VARIANT_MAP = {
    "(Basic)": 2,
    "Trial": 1,
    "Team": 3,
    "Expired": 10,
    "Refunded": 11,
    "Beta": 4
};

var MENU_ITEMS_MAPPING = {
  "createPlaylist": {
    "OWNER": "showSidebar",
    "EDITOR": "createPlaylistToOwner"
  },
  "createPost": {
    "OWNER": "createEmail",
    "EDITOR": "createEmailToOwner"
  },
  "uploadPost": {
    "OWNER": "bulkEmail",
    "EDITOR": "createBulkToOwner"
  },
  "playPausePlaylist": {
    "OWNER": "jukeboxActivity",
    "EDITOR": "jukeboxActivityToOwner"
  }
}

/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */

function onOpen(e){
   var version = "V6.6";
   SpreadsheetApp.getActive().toast("Addon Version "+ version);
   var ui = SpreadsheetApp.getUi();
   var menu = ui.createAddonMenu();
 
  //  menu.addItem('Initialize', 'onOpenTest')
  //  menu.addItem("test", 'getViewStateCreatePlaylist')
  menu.addItem('Create/Edit Playlists', 'getViewStateCreatePlaylist')
  menu.addItem('Create Posts', 'getViewStateCreatePost')
  menu.addItem('Upload Posts', 'getViewStateUploadPost')
  menu.addItem('Play/Pause Playlists', 'getViewStatePlayPausePlaylist')
 // menu.addItem('Upgrade', 'getViewStateUpgrade')
  menu.addItem('Getting Started Guide', 'gettingStarted')
  menu.addToUi();
}

function getViewStateCreatePlaylist(){
  var userRole = determineUserViewState();
  if(userRole != false){
    var file = MENU_ITEMS_MAPPING["createPlaylist"][userRole];
    SpreadsheetApp.getActive().toast("Permission "+ userRole + " Playlist Creator" );//+ file);
    this[file]();
  }
  else{
    return false;
  }
}

function getViewStateCreatePost(){
  var userRole = determineUserViewState();
  if(userRole != false){
    var file = MENU_ITEMS_MAPPING["createPost"][userRole];
    SpreadsheetApp.getActive().toast("Permission "+ userRole + " Post Creator" );//+ file);
    this[file]();
  }
  else{
    return false;
  }
}
function getViewStateUploadPost(){
  var userRole = determineUserViewState();
  if(userRole != false){
    var file = MENU_ITEMS_MAPPING["uploadPost"][userRole];
    SpreadsheetApp.getActive().toast("Permission "+ userRole + " Bulk Post Creator" );// + file);
    this[file]();
  }
  else{
    return false;
  }
}

function getViewStatePlayPausePlaylist(){
  var userRole = determineUserViewState();
  if(userRole != false){
    var file = MENU_ITEMS_MAPPING["playPausePlaylist"][userRole];
    SpreadsheetApp.getActive().toast("Permission "+ userRole + " Play Pause Playlist" ); //+ file);
    this[file]();
  }
  else{
    return false;
  }
}

function getViewStateUpgrade(){
  var userRole = determineUserViewState();
  if(userRole != false && userRole == "OWNER"){
    gumroadApi();
  }
  else{
    return false;
  }
}
 

function determineUserViewState(){
  var email = Session.getEffectiveUser().getEmail();
  var file = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
  var user = Session.getActiveUser();// emailUser
  var permission = String(file.getAccess(user));
  var emailUser = user;
 // return "OWNER"
  if (permission == "OWNER"){
    var subscription = getFBDataByEmail(email);
    if (subscription != null) {
      if (VARIANT_MAP[subscription.status] == 10) {
         SpreadsheetApp.getActive().toast("Subscription Expired");
        return false;
      } else {
        return "OWNER"
      }
    }
  } else {
    var subOwner = getFBDataByEmail(getSheetOwner());
    if (VARIANT_MAP[subOwner.status] == 10 || VARIANT_MAP[subOwner.status] == 2) {
      SpreadsheetApp.getActive().toast("Subscription Expired or License is Basic");
      return false;
    } else if (VARIANT_MAP[subOwner.status] == 3 || typeof subOwner.status == "object") {
      
      return "EDITOR";
    }
  }
}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  try{
    var file = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
    var user = getEmailFromGmail();// emailUser
    var permission = String(file.getAccess(user));
    if (permission == "OWNER"){
      PropertiesService.getScriptProperties().deleteAllProperties();
      
      var email = Session.getEffectiveUser().getEmail();
      
      //    PropertiesService.getUserProperties().deleteProperty("userEmail");
      var date = getEndTrialPeriod();
      setFBData(email, { "Trial": date });
      
      // Create parent Gmail label.
      GmailApp.createLabel("Repeat Post");
      PropertiesService.getUserProperties().setProperty("userEmail", user);
      ownerSettingsToDocumentProps();
//      setTemplate();
      //   var newEmail = //getEmailFromGmail();
    }
    createTrigger();
    onOpen(e);
  }
  catch(e){
    SpreadsheetApp.getActive().toast(e.toString());
  }
}


/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
    //var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
    var ui = HtmlService.createTemplateFromFile('Sidebar').evaluate()
        .setTitle('Playlist Creator');

    SpreadsheetApp.getUi().showSidebar(ui)
}

function createEmail() {
    //var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
    var ui = HtmlService.createTemplateFromFile('createEmail').evaluate()
        .setTitle('Post Creator');
    //  DocumentApp.getUi().showSidebar(ui);
    SpreadsheetApp.getUi().showSidebar(ui)
}

function bulkEmail() {

    var ui = HtmlService.createTemplateFromFile('bulkEmail').evaluate()
        .setTitle('Bulk Post Creator');
    SpreadsheetApp.getUi().showSidebar(ui)
}

function jukeboxActivity() {

    var ui = HtmlService.createTemplateFromFile('JukeboxActivity').evaluate()
        .setTitle('Playlist Status');
    SpreadsheetApp.getUi().showSidebar(ui)
}

function jukeboxActivityToOwner(){
    var ui = HtmlService.createTemplateFromFile('JukeboxActivity_toOwner').evaluate()
        .setTitle('Playlist Status');
    SpreadsheetApp.getUi().showSidebar(ui)

}

function gumroadApi() {

    var ui = HtmlService.createTemplateFromFile('Gumroad').evaluate()
        // .setTitle('Upgrade');
    SpreadsheetApp.getUi().showModalDialog(ui, 'Upgrade'); // showSidebar(ui)
}

function gettingStarted() {
    var html = '<iframe width="560" height="315" \
       src="https://www.youtube.com/embed/HD26tAuyPD4" frameborder="0" allowfullscreen></iframe>';
    var html_ev = HtmlService.createHtmlOutput(html).asTemplate().evaluate().setWidth(600).setHeight(380);
    SpreadsheetApp.getUi().showModalDialog(html_ev, 'Getting Started Video');
}

function createPlaylistToOwner() {
    //var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
    var ui = HtmlService.createTemplateFromFile('CreatePlaylistToOwner').evaluate()
        .setTitle('Playlist Creator To Owner');
    //  DocumentApp.getUi().showSidebar(ui);
    SpreadsheetApp.getUi().showSidebar(ui)
}

function createEmailToOwner() {
    //var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
    var ui = HtmlService.createTemplateFromFile('CreateEmailToOwner').evaluate()
        .setTitle('Post Creator To Owner');
    //  DocumentApp.getUi().showSidebar(ui);
    SpreadsheetApp.getUi().showSidebar(ui)
}

function createBulkToOwner() {
    //var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
    var ui = HtmlService.createTemplateFromFile('bulkEmailToOwner').evaluate()
        .setTitle('Bulk Post Creator to Owner');
    //  DocumentApp.getUi().showSidebar(ui);
    SpreadsheetApp.getUi().showSidebar(ui)
}

function successModal() {
    var html = "<h2 style='text-align:center;'> You have successfully upgraded. </h2>"
    var html_ev = HtmlService.createHtmlOutput(html).asTemplate().evaluate();
    SpreadsheetApp.getUi().showModalDialog(html_ev, 'Success');

}

function showPrompt(msg) {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(msg, ui.ButtonSet.YES_NO)
        // Process the user's response.
    if (response == ui.Button.YES) {
        return 1;
    } else if (response == ui.Button.NO) {
        return 0;
    } else {
        return 0;
    }

}

function showModalDialog() {
    var html = HtmlService.createHtmlOutputFromFile('test')
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
        .showModalDialog(html, 'Dialog title');
}

function setTemplate() {
    //    var sheet = SpreadsheetApp.getActive().insertSheet('[Logs] Recurring Email Scheduler');
    var sheet = getSheet('[Logs] Recurring Email Scheduler');
    var row1Color = '#1155cc';
    var row2Color = '#3c78d8';
    sheet
    .setColumnWidth(1, 134)
    .setColumnWidth(2, 336)
    .setColumnWidth(3, 336)
    .setColumnWidth(4, 109)
    .setColumnWidth(5, 134)
    .setColumnWidth(6, 125)
    .setColumnWidth(7, 82)
    sheet.getRange(1, 1, 1, 2).merge();
    sheet.getRange(1, 1, 1, 6).setBackground(row1Color);
    sheet.getRange(2, 1, 1, 6).setBackground(row2Color);
    sheet.setRowHeight(1, 40).setRowHeight(2, 37);
    sheet.getRange(1, 1).setValue('E M A I L    S C H E D U L E R    F O R    G M A I L   ')
        .setFontColor('white').setVerticalAlignment('middle').setHorizontalAlignment('Center');
    sheet.getRange(2, 1, 1, 4).setValues([
            ['Date', 'Description', 'Debug Log', 'Rule Id']
        ]).setFontColor('white')
        .setVerticalAlignment('middle').setHorizontalAlignment('Center');
//    sheet.deleteColumns(7, sheet.getMaxColumns() - 6);
  var delSheet = SpreadsheetApp.getActive().getSheetByName("Sheet1");
  if(delSheet){
    SpreadsheetApp.getActive().deleteSheet(delSheet)
  }
}


function setFormatLabelSheet(sheet_name) {
  // sheet_name = '► test1'
    var SS = SpreadsheetApp.getActive();
    var sheet = SS.getSheetByName(sheet_name);
    sheet.getRange(1, 1, 1, 2).merge()
        .setBackground('#6aa84f')
        .setValue('Playlist Details')
        .setFontFamily('Montserrat')
        .setFontSize(18)
        .setFontColor('white')
        .setVerticalAlignment('middle')
        .setHorizontalAlignment('Center')
        .setFontWeight('bold');

    sheet.setColumnWidth(1, 200)
        .setColumnWidth(2, 500)
        .setColumnWidth(3, 200)
        .setColumnWidth(4, 150)
        .setColumnWidth(5, 150)
        .setColumnWidth(6, 150)
        .setColumnWidth(7, 82)
    sheet.getRange(2, 1, 10, 2).setBorder(true, true, true, true, false, false);


    sheet.getRange(13, 1, 1, 7).merge()
        .setBackground('#6aa84f')
        .setValue('Playlist Posts')
        .setVerticalAlignment('middle')
        .setHorizontalAlignment('Center')
        .setFontFamily('Montserrat')
        .setFontSize(12)
        .setFontColor('white')
        .setFontWeight('bold');

    sheet.getRange(14, 1, 1, 7)
        .setBackground('#f3f3f3')
        .setValues([
            ['To', 'Subject', 'Body', 'Attachment', 'Last Sent','Post ID', 'Times Sent']
         // To, Subject, Body, Attachment, Last Sent, Post ID 
        ])
        .setFontWeight('bold')
        .setVerticalAlignment('middle')
        .setHorizontalAlignment('Center')
        .setFontFamily('Montserrat')
        .setFontSize(10)
        .setFontColor('black')

    Logger.log(sheet.getRange(1, 1, 1, 2).getBackground())

}

function testForm() {
    var SS = SpreadsheetApp.getActive();
    var sheet = SS.getSheetByName('Playlist Formatting');
    Logger.log(sheet.getRange(14, 1).getFontFamily())
}

function getUserLabelSheets() {

    var sign = '► ';
    var SS = SpreadsheetApp.getActive();
    var sheets = SS.getSheets();
    var arr = [];
    for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].getName().indexOf('► ') > -1) {
            arr.push(sheets[i].getName().slice(2, sheets[i].getName().length));
        }
    }
    return arr;
}
 

function addSentEmailInfoToSheet(object) { 
    var sign = '► ';
    var SS = SpreadsheetApp.getActive();
    var splitLabel = object.label.split('Repeat Post/')[1];
    var sheet = SS.getSheetByName(sign + splitLabel);
//    dataForEmail = [object.id, object.subject,object.to, object.body, object.attachment[0] != null ? object.attachment[0].fileName : "None", object.lastSent || "Not Sent"];
  Logger.log("Obj att: "+  object.attachment[0] )
 
  if(typeof object.attachment[0] != "undefined"){
    Logger.log("Obj atttribute : "+  object.attachment.fileName)
    object.attachment = object.attachment[0].fileName
  }
   dataForEmail = [object.to,  object.subject,object.body, object.attachment != "" ? object.attachment: "None", object.lastSent || "Not Sent",object.id];
  //  To, Subject, Body, Attachment, Last Sent, Post ID 
    if (dataForEmail) {
      var sheetData = sheet.getRange(15, 6, sheet.getLastRow(), 2).getValues();
      sheetLog("Sheet index"+sheet.getLastRow());
      
      
      sheet.getRange(sheet.getLastRow()+1, 1).setValue('Processing...');
      var sheetlastDataRow = sheet.getLastRow();
      sheetlastDataRow = sheetlastDataRow - 1;
      sheet.getRange(sheet.getLastRow(), 1).setValue('');
      
      
      Logger.log("Sheet Data " + sheetData)
      sheetData = sheetData.filter(function(id){
        
        if(id[0] != ""){ // id was 0 pointing to ID
           Logger.log("Post filter: " + id )
          return id
        }
      });
      for(var i = 0 ;i < sheetData.length;i++){
        Logger.log("Post ID: "+ sheetData[i][0] + "  Created Post ID: "+dataForEmail[5])
        if(sheetData[i][0] == dataForEmail[5]){
          var times_sent = !isNaN(sheetData[i][1]) ? (parseInt(sheetData[i][1]) + 1 ): 0;
          Logger.log("Times Sent " + (parseInt(sheetData[i][1]) + 1));
          
          dataForEmail.push(times_sent);
          Logger.log(dataForEmail)
          sheet.getRange(i+15,1,1,dataForEmail.length).setValues([dataForEmail]);
          return 0;
        }
        Logger.log( dataForEmail)
      }
       dataForEmail.push(0);
        sheet.getRange(sheetlastDataRow + 1, 1, 1,7).setValues([dataForEmail]);
    }
    dataForEmail = [];
    protectSheet(sheet.getName());

}


function getEmailLastSent(id) {
    var infoEmail = PropertiesService.getScriptProperties().getProperty(id);
    if (!infoEmail) {
        return null;
    }
    var json = JSON.parse(infoEmail);
    return json.date;
}

function protectSheet(sheetName) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    var me = getEmailFromGmail();//Session.getEffectiveUser().getEmail();

   // var protection = sheet.protect().setDescription('Sample protected sheet').setWarningOnly(true);
}

function unProtectSheet(sheetName) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    SpreadsheetApp.flush();
    sheet.protect().remove();
}
