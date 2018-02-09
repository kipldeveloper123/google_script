 function createDraftWithAttachments(json) {
   Logger.log("Confirming log is working");
//   json = {
//     subject: "asdasd", body: "adasd", to: "",labels: ["test1"],attachment: null
//   }
     try {
         var attachments = json["attachment"] ? [json.attachment] : [];
         var to_json = json["to"].replace(',', ' ');
         var message = {
             to: {
                 email: to_json || ""
             },
             body: {
                 text: json["body"] || "",
                 html: json["body"] || ""
             },
             subject: json["subject"] || "",
             files: getAttachments_(attachments) || "None"
         };

         // Compose Gmail message and send immediately
         return callGmailAPI_(message, json.labels);
     } catch (e) {
         sheetLog('Error Create Draft: ' + e.toString());
     }
 }

 function callGmailAPI_(message, labels) {
     try {
     var payload = createMimeMessage_(message);
     var response = UrlFetchApp.fetch(
         "https://www.googleapis.com/upload/gmail/v1/users/me/drafts?uploadType=media", {
             method: "POST",
             headers: {
                 "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
                 "Content-Type": "message/rfc822",
             },
             muteHttpExceptions: true,
             payload: payload
         });

     var json_resp = JSON.parse(response.getContentText());
     Logger.log(json_resp);
     if (response.getResponseCode() == 200) {
         var msg_id = json_resp.message.threadId;
         if (labels.length > 0) {
             for (var i = 0; i < labels.length; i++) {
                 addLabelToDraft(msg_id, labels[i]);
             }
         }
      
       return {
         id: msg_id,
         subject: message.subject,
         body: message.body.text,
         to: message.to.email,
         attachment: message.files || "None",
         sent: "Not Sent",
         label: "Repeat Post/"+labels[0]
       };
     } else {
         return 'error';
     }
     } catch (e) {
         sheetLog('Error Create Draft: in callGmailAPI_ ' + e.toString());
     }

 }

 // UTF-8 characters in names and subject
 function encode_(subject) {
     var enc_subject = Utilities.base64Encode(subject, Utilities.Charset.UTF_8);
     return '=?utf-8?B?' + enc_subject + '?=';
 }

 // Insert file attachments from Google Drive
 function getAttachments_(ids) {
     var att = [];
     for (var i in ids) {

         var file = DriveApp.getFileById(ids[i]);
         att.push({
             mimeType: file.getMimeType(),
             fileName: file.getName(),
             bytes: Utilities.base64Encode(file.getBlob().getBytes())
         });

     }
     return att;
 }

 // Create a MIME message that complies with RFC 2822
 function createMimeMessage_(msg) {

     var nl = "\n";
     var boundary = "__reccuring_addon__";
     Logger.log("msg subject");
     Logger.log(msg.body.text)
     var mimeBody = [

         "MIME-Version: 1.0",
         "To: " + msg.to.email,
         "Subject: " + encode_(msg.subject), // takes care of accented characters
         "Content-Type: multipart/alternative; boundary=" + boundary + nl,
         "--" + boundary,

         "Content-Type: text/plain; charset=UTF-8",
         "Content-Transfer-Encoding: base64" + nl,
         Utilities.base64Encode(msg.body.text, Utilities.Charset.UTF_8) + nl,
         "--" + boundary,

         "Content-Type: text/html; charset=UTF-8",
         "Content-Transfer-Encoding: base64" + nl,
         Utilities.base64Encode(msg.body.html, Utilities.Charset.UTF_8) + nl

     ];

     for (var i = 0; i < msg.files.length; i++) {

         var attachment = [
             "--" + boundary,
             "Content-Type: " + msg.files[i].mimeType + '; name="' + msg.files[i].fileName + '"',
             'Content-Disposition: attachment; filename="' + msg.files[i].fileName + '"',
             "Content-Transfer-Encoding: base64" + nl,
             msg.files[i].bytes
         ];

         mimeBody.push(attachment.join(nl));

     }

     mimeBody.push("--" + boundary + "--");

     return mimeBody.join(nl);

 }

 function getDraftLabels() {
     var draftMsgs = GmailApp.getDraftMessages();
     var unique = {};
     for (var i = 0; i < draftMsgs.length; i++) {
         var labels = draftMsgs[i].getThread().getLabels();
         for (var j = 0; j < labels.length; j++) {
             if (!unique[labels[j].getName()]) {
                 unique[labels[j].getName()] = true;
             }
         }
     }
     Logger.log(Object.keys(unique))
     return Object.keys(unique);
 }

 function getAllGmailLabels() {
     var labels = [];
     var parentName = "Repeat Post/";
     var msgs = GmailApp.getUserLabels();
     for (var i = 0; i < msgs.length; i++) {
         if (msgs[i].getName().slice(0, parentName.length) == parentName) {
             labels.push(msgs[i].getName().slice(parentName.length, msgs[i].getName().length));
         }
     }

     return labels;
 }

 function addLabelToDraft(draftId, labelName) {
     var label = createNestedGmailLabel(labelName); //createLabel(labelName);
     GmailApp.getThreadById(draftId).addLabel(label);
 }

 function createLabel(labelName) {

     var checkLabel = getUserLabels(labelName);
     if (checkLabel) {
         Logger.log(checkLabel.getName())
         return checkLabel;
     }
     return GmailApp.createLabel(labelName);
 }

 function getUserLabels(labelName) {
     return GmailApp.getUserLabelByName(labelName);
 }

 function getAllEmailsByLabel(label) {
     //  label = "kris123";
     var sheet_name = '► ' + label;
     var sheet = SpreadsheetApp.getActive().getSheetByName(sheet_name);
     var parentName = "Repeat Post/" + label;
     var sheetData = sheet.getRange(15, 6, sheet.getLastRow(), 1).getValues();
     sheetData = sheetData.filter(function(id) {
         if (id[0] != "") {
             return id
         }
     });
   
     var newLabel = GmailApp.getUserLabelByName(parentName);
     var emails = newLabel.getThreads().map(function(thread) {
       return [thread.getMessages()[0].getTo(),  thread.getMessages()[0].getSubject(), thread.getMessages()[0].getBody(), 
               typeof thread.getMessages()[0].getAttachments()[0] != "undefined" ? thread.getMessages()[0].getAttachments()[0].getName() : "None", "Not Sent",thread.getMessages()[0].getId(),0];
 
     });
     var sheetEmails = sheet.getRange(15, 1, sheet.getLastRow(), 7).getValues();
     var newArr = [];
     sheetEmails = sheetEmails.filter(function(row) {
         if (row[5] != "") {
             return row 
         }
     });
 
     for (var i = 0; i < emails.length; i++) {
         var check = true;
         for (var j = 0; j < sheetEmails.length; j++) {
             
             if (emails[i][5].toString() == sheetEmails[j][5].toString()) {
              Logger.log(emails[i][5] +' email ' +sheetEmails[j][5])
                 check = false;
             }
         }
         if (check ) {
           Logger.log("check -> True");
             newArr.push(emails[i])
         }
     }

     return newArr;
 }

 function periodicallyUpdateSheetLabels() {
     var sheetSign = '► ';
     var labels = getAllGmailLabels();
     var SS = SpreadsheetApp.getActive();
     for (var i = 0; i < labels.length; i++) {
       var sheet = SS.getSheetByName(sheetSign + labels[i]);
       if (!sheet) {
           continue;
       }
       Logger.log(labels[i])
       var emails = getAllEmailsByLabel(labels[i]);
       var sheetData = sheet.getRange(15, 6, sheet.getLastRow(), 1).getValues(); 
         if (emails.length > 0) {
               sheet.getRange(sheet.getLastRow() + 1, 1, emails.length, emails[0].length).setValues(emails);
         }
     }
 }

 function filterEmailsByDate(emails) {
     try {
         var temp_arr = [];
         var curr_date = getCurrentDate('full');
         for (var i = 0; i < emails.length; i++) {

             var threadId = emails[i].getId();
             var info = getSentEmailInfo(threadId);
             if (!info) {
                 temp_arr.push(emails[i]);
                 continue;
             }
             if (curr_date == info.date || curr_date == info.count) {
                 temp_arr.push(emails[i]);
             } else if ((info.count == 0)) {
                 temp_arr.push(emails[i]);
             }

         }
         return temp_arr;
     } catch (e) {
         sheetLog('err filterEmailsByDate: ' + e.toString());
     }
 }


 function setSentEmailInfo(id, obj) {
     var info = JSON.stringify({
         date: obj.date,
         count: obj.count,
         //         created: obj.date
     });
     PropertiesService.getScriptProperties().setProperty(id, info);
 }

 function getSentEmailInfo(id) {
     var info = JSON.parse(PropertiesService.getScriptProperties().getProperty(id));
     return info;
 }

 function deleteSentEmailInfo(id) {
     return PropertiesService.getScriptProperties().deleteProperty(id);
 }

 function getEmailFromGmail() {
   try{
     var threads = threads = GmailApp.search('is:sent', 0, 1);
     if (threads.length > 0) {
         var messages = threads[0].getMessages();
         var senderEmail = messages[0].getFrom();
         if (senderEmail && senderEmail.indexOf('<') > -1) {
             var extract = senderEmail.match(/<(.*)>/);
             senderEmail = extract[1];
         }
         PropertiesService.getUserProperties().setProperty("userEmail", senderEmail);
         Logger.log("Gmail: " + senderEmail)
         return senderEmail;
     } else {
         var sentEmail = GmailApp.sendEmail("troy@repeatpost.com", "First Sent Email", "email sent");
         getEmailFromGmail();
     }
   }
   catch(e){
     Logger.log(Session.getActiveUser().getEmail())
     return Session.getActiveUser().getEmail();
   }
 }

 