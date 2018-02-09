function doGet() {

    return HtmlService.createTemplateFromFile('Sidebar').evaluate().setTitle('Recurring Email')
        //  .setFaviconUrl("http://www.clipartkid.com/images/203/music-headphones-icon-coloring-book-colouring-scallywag-coloring-5aNjee-clipart.png")
        .setSandboxMode(HtmlService.SandboxMode.IFRAME).addMetaTag("viewport", "width=device-width, initial-scale=0.9,  user-scalable=0");   
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function triggerExecute(){
  sheetLog('start of this function');
  //Check Trial User if expired-> set to Expired
  updateUserSubscription();
  ownerSettingsToDocumentProps();
  //Create posts added from Editors
  createEditorEmailPosts();
  createEditorEmailPlaylists();
  createEditorBulkEmailPosts();
  
  //Remove Script properties , for deleted sheet. 
  removeDeletedSheetProperties();
  executeJukebox();
  //Update emails in Playlist Sheets
  periodicallyUpdateSheetLabels();
  sortSheets();
  sheetLog('end of this function');
}

function createUpdateLabelPref(lblName, json) {
    try {

        sheetLog('enter create update');
        var check_name = lblName.toLowerCase().trim();
        var prop = PropertiesService.getUserProperties().getProperty(check_name);
        if (prop) {
            PropertiesService.getUserProperties().deleteProperty(check_name);
            PropertiesService.getUserProperties().setProperty(check_name, json);
            //setting Document Propery
            PropertiesService.getDocumentProperties().deleteProperty(check_name);
            PropertiesService.getDocumentProperties().setProperty(check_name, json);
        } else {
            PropertiesService.getUserProperties().setProperty(check_name, json);
            //setting Document Propery
            PropertiesService.getDocumentProperties().setProperty(check_name, json);
        }
        var gmail_lbl = GmailApp.getUserLabelByName(lblName);
        if (!gmail_lbl) {
            createNestedGmailLabel(lblName)
        }

        sheetLog('call queue func')
        addToTriggerQueue(JSON.parse(json));
        return true;
    } catch (e) {
        Logger.log(e);
        sheetLog('err: ' + e.toString());
        return e.toString();
    }
}

function getUserLabelPref(lblName) {
    var check_name = lblName.toLowerCase().trim();
    var prop = PropertiesService.getUserProperties().getProperty(check_name);
    if (!prop) {
     prop = PropertiesService.getDocumentProperties().getProperty(check_name);
    }
  
    return prop ? prop : false;
}

function setActiveSheetByLabel( lblName ){
  var sheet_name = '► ' + lblName;
   var SS = SpreadsheetApp.getActive();
   var sheet = SS.getSheetByName(sheet_name);
  if(sheet){
    SS.setActiveSheet(sheet);
  }
}
function deleteUserLabelPref(lblName) {
    var check_name = lblName.toLowerCase().trim();
    var SS = SpreadsheetApp.getActive();
    var sheet_name = '► ' + lblName;
  if(check_name == ""){ return false;}
    var check_prop = PropertiesService.getUserProperties().deleteProperty(check_name) ? true : false;
    if (check_prop) {
        SS.getSheetByName(sheet_name) ? SS.deleteSheet(SS.getSheetByName(sheet_name)) : false;
        PropertiesService.getDocumentProperties().deleteProperty(check_name)  
    }
    removeFromTriggerQueue(lblName);
    return check_prop;
}

function getEmailsByLabel(lblName){
  lblName = 'Repeat Post/'+lblName;
  var emails = GmailApp.search('in:draft AND label:' + lblName + '');
  return emails;
}

function createNestedGmailLabel(usrLabel) {

    var name = "Repeat Post/" + usrLabel;
    var labels = name.split("/");
    var gmail, label = "";
    for (var i = 0; i < labels.length; i++) {
        if (labels[i] !== "") {
            label = label + ((i === 0) ? "" : "/") + labels[i];
            gmail = GmailApp.getUserLabelByName(label) ?
                GmailApp.getUserLabelByName(label) : GmailApp.createLabel(label);
        }
    }

    return gmail;
}

function children() {
    var name = "Repeat Post" + '/';
    return GmailApp.getUserLabels().filter(function(label) {
        return label.getName().slice(0, name.length) == name;
    });
}
 
function setLabelPrefToSheet(json) {
    var SS = SpreadsheetApp.getActive();
    var sheet_name = '► ' + json.f_label;
    var sheet = SS.getSheetByName(sheet_name);
    if (!sheet) {
        SS.insertSheet(sheet_name);
        sheet = SS.getSheetByName(sheet_name);
        setFormatLabelSheet( sheet.getName() );
    }
    sheet.getRange(2, 1).setValue('1');
    sheet.getRange(2, 1, 10, 2).clearContent();
    var data = [
        ['Label', json.f_label],
        ['To Email(s)', json.f_to],
        ['Start Date', json.f_datepicker],
        ['Repeat Type', json.f_repeat]
    ];
    if (json.f_repeat == 'Weekly') {
        data.push(['Repeats every ', json.f_repeat_num + ' Week(s)'])
        data.push(['Repeat on', json.f_repeat_days.join(',')]);

    } else if (json.f_repeat == 'Monthly') {
        data.push(['Repeat every ', json.f_repeat_monthly + ' Month(s)']);
        if (Object.keys(json.f_radio_month)[0] == 'day') {
            data.push(['Day: ', json.f_radio_month.day + ' of the month']);
        } else {
            data.push(['The ', json.f_radio_month.weeks.day + ' ' + json.f_radio_month.weeks.week + ' of the month']);
        }

    } else if (json.f_repeat == 'Yearly') {

        data.push(['Repeat every ', json.f_repeat_yearly + 'Year(s)']);
        data.push(['On ', json.f_radio_yearly.every.join(',')]);

    }
    data.push(['Posts per day', json.f_numberpicker_per]);
    data.push(['Posts between ', json.f_timepicker_from + ' and ' + json.f_timepicker_to]);
    data.push(['No repeats for ', json.f_numberpicker_not + ' day(s)']);
    var end_date = Object.keys(json.f_radio)[0] == "never" ? "Never" : json.f_radio[Object.keys(json.f_radio)[0]];
    data.push(['End Date ' , end_date]);
    sheet.getRange(2, 1, data.length, 2).setValues(data).setHorizontalAlignment('center');
    sheet.getRange(2, 1, sheet.getLastRow()).setFontWeight('bold');
    sheet.getRange(2, 1, 10, 1).setHorizontalAlignment('right');
    
  var emailsLabel = getAllEmailsByLabel( json.f_label );
   if(emailsLabel != null){
    sheet.getRange(sheet.getLastRow()+1, 1, emailsLabel.length, emailsLabel[0].length).setValues(emailsLabel);
  }
  
  checkInitialSheetExists();
}

function saveAttachmentId(id) {
    return PropertiesService.getUserProperties().setProperty('attach_id', id);
}

function getAttachmentId() {
    var check_id = PropertiesService.getUserProperties().getProperty('attach_id');
    if (check_id) {
        PropertiesService.getUserProperties().deleteProperty('attach_id');
        return check_id;
    }
    return null;
}

function saveFile(data, name, folderName) {

    var contentType = data.substring(5, data.indexOf(';'));
    var file = Utilities.newBlob(Utilities.base64Decode(data.substr(data.indexOf('base64,') + 7)), contentType, name);
  
    if (DriveApp.getFoldersByName(folderName).hasNext()) {

        var new_file = DriveApp.getFoldersByName(folderName).next().createFile(file);
        return new_file.getId();
    } else {
        var new_file = DriveApp.createFolder(folderName).createFile(file);
        return new_file.getId();
    }
}

function saveFileCsv(data, name, folderName, userObj) {

    var contentType = data.substring(5, data.indexOf(';'));
    var fileBlob = Utilities.newBlob(Utilities.base64Decode(data.substr(data.indexOf('base64,') + 7)), contentType, name);
    var values = [];
    var rows = fileBlob.getDataAsString().split('\n');
    for (var r = 1, max_r = rows.length; r < max_r; ++r) {
        values.push(rows[r].split(',')); // rows must have the same number of columns
        if (rows[r].split(',')[1] == "") {
            throw new Error("Import not complete, Please check your CSV Template.");
        }
        var singleRow = rows[r].split(',');
        sheetLog('CSV values: ' + rows[r]);

        createDraftWithAttachments({
            to: singleRow[0] ? singleRow[0] : '',
            body: (singleRow[2] ? singleRow[2] : '') + (userObj.addToBody ? '<br />' + userObj.addToBody.split('\n').join('<br />') : ''),
            subject: singleRow[1] + (userObj.addToSub ? userObj.addToSub : ''),
            labels: userObj.addToLabel ? userObj.addToLabel : [],
            attachment: userObj.attachment
        });
    }
}

function sheetLog(log) {
  try {
    var sheet = getSheet('Log');
    sheet.setColumnWidth(1, 336)
    Logger.log(log)
    sheet.getRange(sheet.getLastRow() + 1, 1).setValue(log.toString());
  }
  catch(e){
    var rows = Math.floor(sheet.getLastRow() / 2);
    sheet.deleteRows(1, rows)
  }
}

function sheetMyLog(log) {
  try {
    var sheet = getSheet('MyLog');
    sheet.setColumnWidth(1, 336)
    Logger.log(log)
    sheet.getRange(sheet.getLastRow() + 1, 1).setValue(log.toString());
  }
  catch(e){
    //var rows = Math.floor(sheet.getLastRow() / 2);
    //sheet.deleteRows(1, rows)
    sheet.getRange(sheet.getLastRow() + 1, 1).setValue(e.message);
     e.message
  }
}
 

function sheetMainLog(log,id) {
    
    var sheet = getSheet('[Logs] Recurring Email Scheduler');
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 4).setValues([[getCurrentDate('full').toString(),log.toString(),'',id]]);
}

function getActiveUserEmail(){
  return Session.getEffectiveUser().getEmail();
}

function getSheet(sheetName) {
    var spreadsheet = SpreadsheetApp.getActive();
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet == null) {
        sheet = spreadsheet.insertSheet(sheetName);
    }
    return sheet;
}

function checkOldEmailSent(){
  var time = convertTime12to24(getCurrentDate('h'));
  if(time.split(':')[0] >= 12 && time.split(':')[0] < 1){
    var juke_keys = PropertiesService.getScriptProperties().getKeys();
    for each(var key in juke_keys) {
      var prop = JSON.parse(PropertiesService.getScriptProperties().getProperty(key));
      var objLen = Object.keys(prop).length;
      if(objLen == 2){
        if(!checkMonthIsGreater(prop.count)){
           deleteSentEmailInfo(key);
        }
        if(!GmailApp.getMessageById(key)){
            deleteSentEmailInfo(key);
        }
      } 
    }
  } 
}


function removeDeletedSheetProperties() {
  var sheets = SpreadsheetApp.getActive().getSheets();
  var sheetNames = [];
  for(var i = 0; i < sheets.length;i++) {
    if(sheets[i].getName().indexOf('►') > -1){
      sheetNames.push(sheets[i].getName().replace('► ','Repeat Post/'));
    }
  }
  if(sheetNames.length > 0) {
    var keys = PropertiesService.getScriptProperties().getProperties()//.getKeys();
    var propArray = [];
    for(var key in keys){
      var prop = JSON.parse(PropertiesService.getScriptProperties().getProperty(key));
      if( typeof prop.label != "undefined"){
        propArray.push(prop.label)
      }
    }
 
    var array3 = sheetNames.filter(function(i){
      var index = propArray.indexOf(i);
      if( index !== -1){
        propArray.splice(index, 1);
        return true;
      }
    });
    
    Logger.log(propArray)
    for(var j = 0;j<propArray.length;j++){
      sheetLog("Sheet Name "+propArray[j]);
      var label = GmailApp.getUserLabelByName(propArray[j]);
       sheetLog(label);
      GmailApp.deleteLabel(label);
      var delProp = propArray[j].replace('Repeat Post/','');
     
      PropertiesService.getScriptProperties().deleteProperty(delProp);
    }
  } 
}

function checkInitialSheetExists(){
  if(PropertiesService.getDocumentProperties().getProperty("initialSheet")){
    return;
  }
  var initialSheet = SpreadsheetApp.getActive().getSheetByName('Sheet1');
  if (initialSheet){
    SpreadsheetApp.getActive().deleteSheet(initialSheet);
    PropertiesService.getDocumentProperties().setProperty("initialSheet", true);
    return true;
  }
  return false;
}


function sortSheets(){
  var SS = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = SS.getSheets();
  var sheet = SS.getSheetByName("Log");
  var playlists = [];
  var LogSheet;
  var counter = 0;
  for(var i = sheets.length -1; i >= 0 ; i--){
    if(sheets[i].getName().indexOf('►') > -1){
      playlists.push( sheets[i] );
      sheets[i].activate();
      SS.moveActiveSheet(counter += 1)
      sheets.splice(i, 1);
    }
    if(sheets[i].getName() == 'Log'){
      LogSheet = sheets[i];
      sheets.splice(i, 1);
    }
  }

  if(typeof LogSheet != "undefined"){
    LogSheet.activate();
    SS.moveActiveSheet(counter += 1);
  }
  
  var sortedArray = sheets.sort(function (a, b) {
      if (a.getName() < b.getName()) return -1;
      else if (a.getName() > b.getName()) return 1;
      return 0;
    });
  
  for(var i = 0; i < sortedArray.length;i++){
     sortedArray[i].activate();
     SS.moveActiveSheet(counter += 1)
  }
}

function deleteDefaultSheetByLabel()
{
  var SS = SpreadsheetApp.getActive();
  var sheet = SS.getSheetByName('Sheet1');
  if(sheet){
    SS.deleteSheet(sheet);
  }
}

function syncsheetProperties()
{
  sheetLog('end of this function');
   var sheets = SpreadsheetApp.getActive().getSheets();
  
  var sheetNames = [];
  for(var i = 0; i < sheets.length;i++) {
    if(sheets[i].getName().indexOf('►') > -1){
     var lblName = sheets[i].getName().replace('► ','');
      var check_name = lblName.toLowerCase().trim();
      
      //getUserProperties
      var prop = PropertiesService.getDocumentProperties().getProperty(check_name);
      
      if (prop) {
        
        var docProp = PropertiesService.getUserProperties().getProperty(check_name);
        if(docProp){
          PropertiesService.getUserProperties().deleteProperty(check_name);
        }  
          PropertiesService.getUserProperties().setProperty(check_name, prop);
          //sheetLog(check_name+' '+prop);
      }  
      
      
    }
  }
}
