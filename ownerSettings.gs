function getSheetOwner(){
  return SpreadsheetApp.getActive().getOwner().getEmail();
}

function isEditorOwner(user){
 
  return getEmailFromGmail() == getSheetOwner();
}

function getSheetEditors(){
  Logger.log(SpreadsheetApp.getActive().getEditors());
  return SpreadsheetApp.getActive().getEditors();
}

function getAllGmailLabelsFromOwner(){
  var prop = JSON.parse(PropertiesService.getDocumentProperties().getProperty('owner'));
  Logger.log(prop)
  if(prop != null){
    return prop.labels;
  }
  return prop;
}

function shareFileWithOwner( id ){
  DriveApp.getFileById(id).addEditor(getSheetOwner())
}

function ownerSettingsToDocumentProps(){
  if(isEditorOwner()){
    var labels = getAllGmailLabels();
    var obj = {
      "labels":labels 
      }
    
    PropertiesService.getDocumentProperties().setProperty("owner",JSON.stringify(obj) );
  }
}
 
function createEditorEmailPosts(){
  var props = PropertiesService.getDocumentProperties().getProperty("posts");
  if(props != null){
    var json = JSON.parse(props);
    var keys = Object.keys(json);
    var currentEmail = Session.getEffectiveUser().getEmail();//Session.getEffectiveUser().getEmail();
    for(var key in json){
      if(json[key] && key != currentEmail){
        Logger.log(json[key])
        for(var i = 0;i < json[key].length;i++){
         //sheetMyLog("adding post to sheet"+JSON.stringify(json[key][i]));
          var resp = createDraftWithAttachments(json[key][i]);
          if(resp){
              //sheetMyLog("adding post to sheetsss"+JSON.stringify(resp));
              //showToast('Draft Created!');
                    //localStorage.removeItem("attachId");
                    // Add email Post created by editor to Playlist sheet
             
                    addSentEmailInfoToSheet({
                            id: resp.id,
                            subject: resp.subject,
                            body: resp.body,
                            to: resp.to,
                            attachment: resp.attachment,
                            sent: "Not Sent",
                            label: resp.label
                        });
            
          }
        }
        
        delete json[key];
      }
    }
    
    PropertiesService.getDocumentProperties().setProperty("posts", JSON.stringify(json))
    var sheet = SpreadsheetApp.getActive().getSheetByName("Post Editor Data");
 
    if(sheet){
      sheet.clear();  
//      sheet.getRange(2, 1, Math.max(sheet.getLastRow(),1), sheet.getLastColumn()).clear();
    }
  }
}

function createEditorEmailPlaylists(){
  var props = PropertiesService.getDocumentProperties().getProperty("playlists");
  if(props != null){
    var json = JSON.parse(props);
    var keys = Object.keys(json);
    var currentEmail = Session.getEffectiveUser().getEmail();//Session.getEffectiveUser().getEmail();
    for(var key in json){
      if(json[key] && key != currentEmail){
        Logger.log(json[key])
        for(var i = 0;i < json[key].length;i++){
          createUpdateLabelPref(json[key][i].f_label, JSON.stringify(json[key][i]));
        }
        delete json[key];
      }
    }
    PropertiesService.getDocumentProperties().setProperty("playlists", JSON.stringify(json))
 
  }
}

function createEditorBulkEmailPosts(){
  var props = PropertiesService.getDocumentProperties().getProperty("bulk_posts");
  if(props != null){
    var json = JSON.parse(props);
    var keys = Object.keys(json);
    var currentEmail = Session.getEffectiveUser().getEmail();//Session.getEffectiveUser().getEmail();
    for(var key in json){
      if(json[key] && key != currentEmail){
        Logger.log(json[key])
        for(var i = 0;i < json[key].length;i++){
          saveFileCsv(json[key][i].result, json[key][i].file_name, json[key][i].folder_name, json[key][i].userObj);
        }
        delete json[key];
      }
    }
    PropertiesService.getDocumentProperties().setProperty("bulk_posts", JSON.stringify(json))
    
  }
}
 
function savePostEmailToDocProps( json ){
  var email = getEmailFromGmail();//Session.getActiveUser().getEmail();//Session.getEffectiveUser().getEmail();
  
  if(json){
    var to_array = json.to.split(',');
    var arr = [];
    
    for(var i =0; i < to_array.length; i++){
     if(to_array[i].trim() != ''){  
       
      
    addEditorHeaderColumns ("Post Editor Data" , ['Email','Subject','Body','To Email','Labels','Attachment']);
    writeEditorOptionsToSheet("Post Editor Data",[json.subject,json.body,to_array[i].trim(),json.labels,json.attachment || "None"],email);
       
       
     var email_json = {
        subject: json.subject,
        body:  json.body,
        to: to_array[i].trim(),
        labels: json.labels,
//        weight: weight,
        attachment: json.attachment
    }  
   
    
    var props = JSON.parse(PropertiesService.getDocumentProperties().getProperty("posts"));
    Logger.log(props)
    if(props == null){
      PropertiesService.getDocumentProperties().setProperty("posts", JSON.stringify({}) );
      props = JSON.parse(PropertiesService.getDocumentProperties().getProperty("posts"));
    } 
    var propEmail = props[email];
        
    if(propEmail){
      arr = propEmail;
      arr.push(email_json);
    }
    else{
      arr = [email_json];
    }
       props[email] = arr;
       PropertiesService.getDocumentProperties().setProperty("posts", JSON.stringify(props))
  }}
    
    
  //sheetMyLog('Post Data again and again ' + JSON.stringify(props));
    
    return true;
  }
  return false;
}

function savePlaylistEmailToDocProps( json ){
  var email = getEmailFromGmail();//Session.getEffectiveUser().getEmail();
   
  if(json){
    
    addEditorHeaderColumns ("Playlist Editor Data" , ['Email','Repeat Type','Date','To Email','Number Repeat per Day','Repeat Days','From Date','To Date','Label']);
    writeEditorOptionsToSheet("Playlist Editor Data",[json.f_repeat,json.f_datepicker,json.f_to,json.f_repeat_num,
                                                      json.f_repeat_days,json.f_timepicker_to,json.f_timepicker_from,json.f_label],email);
   
    
    var arr = [];
    var props = JSON.parse(PropertiesService.getDocumentProperties().getProperty("playlists"));
    Logger.log(props)
    if(props == null){
      PropertiesService.getDocumentProperties().setProperty("playlists", JSON.stringify({}) );
      props = JSON.parse(PropertiesService.getDocumentProperties().getProperty("playlists"));
    } 
    var propEmail = props[email];
    if(propEmail){
      arr = propEmail;
      arr.push(json);
    }
    else{
      arr = [json];
    }
    props[email] = arr;
 
    PropertiesService.getDocumentProperties().setProperty("playlists", JSON.stringify(props))
    
    /* custom code */
     sheetLog(json.f_label+' '+json);
    var lblName = json.f_label;
    var check_name = lblName.toLowerCase().trim();
    var docprop = PropertiesService.getDocumentProperties().getProperty(check_name);
    if(docprop){
      PropertiesService.getDocumentProperties().deleteProperty(check_name);
    }
      PropertiesService.getDocumentProperties().setProperty(check_name, JSON.stringify(json));
    
    /* custom code */
    
    return true;
  }
  return false;
}

function saveBulkEmailToDocProps( json ){
  var email = getEmailFromGmail()// Session.getEffectiveUser().getEmail();
  
  if(json){
    
     addEditorHeaderColumns ("Bulk Post Editor Data" ,['Email','Data','Filename', 'Upload Folder','Subject','Body','Label','Attachment']);
     writeEditorOptionsToSheet("Bulk Post Editor Data",[json.result,json.file_name,json.folder_name,json.userObj.addToSub,json.userObj.addToBody,
                                                        json.userObj.addToLabel,json.userObj.attachment || "None"],email);
 
    var arr = [];
    var props = JSON.parse(PropertiesService.getDocumentProperties().getProperty("bulk_posts"));
    Logger.log(props)
    if(props == null){
      PropertiesService.getDocumentProperties().setProperty("bulk_posts", JSON.stringify({}) );
      props = JSON.parse(PropertiesService.getDocumentProperties().getProperty("bulk_posts"));
    } 
    var propEmail = props[email];
    if(propEmail){
      arr = propEmail;
      arr.push(json);
    }
    else{
      arr = [json];
    }
    props[email] = arr;
 
    PropertiesService.getDocumentProperties().setProperty("bulk_posts", JSON.stringify(props))
    return true;
  }
  return false;
}

function writeEditorOptionsToSheet(sheetName,data){
  var sheet = getSheet(sheetName);
  var currentEmail = Session.getEffectiveUser().getEmail();
  var SS = SpreadsheetApp.getActive();
  if(data.length > 0){
    data.unshift(currentEmail);
    sheet.getRange(sheet.getLastRow()+1,1,1,data.length).setValues([data]);
    SS.setActiveSheet(sheet);
  }
}

function getUserEmail() {
  var userEmail = PropertiesService.getUserProperties().getProperty("userEmail");
  if(!userEmail) {
    var protection = SpreadsheetApp.getActive().getRange("A1").protect();
    // tric: the owner and user can not be removed
    protection.removeEditors(protection.getEditors());
    var editors = protection.getEditors();
    if(editors.length === 2) {
      var owner = SpreadsheetApp.getActive().getOwner();
      editors.splice(editors.indexOf(owner),1); // remove owner, take the user
    }
    userEmail = editors[0];
    protection.remove();
    // saving for better performance next run
    PropertiesService.getUserProperties().setProperty("userEmail",userEmail);
  }
  return userEmail;
}

function addEditorHeaderColumns (sheetName , columns){
  var sheet = getSheet(sheetName);
  sheet.getRange(1,1,1,columns.length).setValues([columns]);
  
}
