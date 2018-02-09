function getDraftEmailThreadsByLabel(lblName) {

    var emails = GmailApp.search('in:draft AND label:' + lblName + '');

    return filterEmailsByDate(emails);
}


function sendGmailDraft(lblName, to, delay) {
     try {
        var msgs = getDraftEmailThreadsByLabel(lblName);
        if (msgs.length < 1) {
            return 0;
        } 

        //Choose one Random Email for Given Label;
        var i = (msgs.length == 1) ? 0 : getRandomInt(msgs.length - 1);
        var draftMsg = msgs[i];
        var msgCount = draftMsg.getMessageCount() > 0 ? draftMsg.getMessageCount() - 1 : 0;
        var lastMsg = draftMsg.getMessages()[msgCount];
        var to_email = lastMsg.getTo();
        var sendTo = to_email ? to_email : to;
        var threadId = draftMsg.getId();
        var attachments = lastMsg.getAttachments().length > 0 ? getAttachmentFile(lastMsg.getAttachments()[0].getName()) : null;
        var attach = attachments ? attachments : null;
        var obj = attach ?  
              [attach] 
          : [];
 
      var emailObj = {
        to:sendTo, 
        subject: lastMsg.getSubject(),
        htmlBody: lastMsg.getPlainBody(),
        attachments: obj
      };
      
      MailApp.sendEmail( emailObj );
        //save ID of the sent EMAIL;
        setSentEmailInfo(threadId, {
            date: getCurrentDate('full'),
            count: delay
        });
        if (delay == getCurrentDate('full')) {
            deleteSentEmailInfo(threadId);
        }
       sheetLog('Mail sent to : ' + sendTo + ' at: ' + getCurrentDate('h') + ' for label: ' + lblName + ' ID: '+ threadId);
        addSentEmailInfoToSheet({
            label: lblName,
            id: threadId,
            lastSent: (getCurrentDate('full') + ' ' + getCurrentDate('h')),
            body: lastMsg.getPlainBody().replace('<br />', String.fromCharCode(10)),
            subject: lastMsg.getSubject(),
            attachment: obj.length > 0 ? obj[0] : "",
            to: lastMsg.getTo()
        });
    } catch (e) {
        sheetLog('err sendGmailDraft: ' + e.toString());
        Logger.log(e.toString());
    }
}

function addToTriggerQueue(json) {
    sheetLog('enter addToTriggerQueue');
    var labelPref = PropertiesService.getScriptProperties();
    var intervals = getTimeIntervals(json.f_timepicker_from, json.f_timepicker_to, json.f_numberpicker_per);
    var data = {
        to: json.f_to,
        from: getActiveUserEmail(),
        label: ("Repeat Post/" + json.f_label),
        startDate: json.f_datepicker,
        repeat: json.f_repeat,
        repeatEvery: json.f_repeat_num,
        repeatOn: json.f_repeat_days,
        endOn: (json.f_radio['on']) ? json.f_radio['on'] : 0,
        betweenRange: intervals,
        notRepeatDays: json.f_numberpicker_not,
        toggle: json.toggle
    }
    sheetLog('writing to script Props');
    labelPref.setProperty(json.f_label.toLowerCase().trim(), JSON.stringify(data));
}

function removeFromTriggerQueue(label) {
    sheetLog('enter removeFromTriggerQueue');
    if (label) {
        PropertiesService.getScriptProperties().deleteProperty(label.toLowerCase().trim());
    }
}


function executeJukebox() {

    checkOldEmailSent();

    var curr_time = getCurrentDate('h');
    var curr_date = getCurrentDate('full');
    var curr_day = getCurrentDate('d');
    var juke_keys = PropertiesService.getScriptProperties().getKeys();
    var active_user_email = getActiveUserEmail();
    sheetLog('Checking Playlists at:  ' + curr_time);
    for each(var key in juke_keys) {
      Logger.log(key)
        var prop = JSON.parse(PropertiesService.getScriptProperties().getProperty(key));
        /* 
         If End on date is current date delete property 
      */
        if (curr_date == prop.endOn) {
            removeFromTriggerQueue(key);
            continue;
        }
        if (curr_date < prop.startDate) {
            continue;
        }
        // If owner of the addon added these Playlists
        if (prop.toggle == 1 && prop.from == active_user_email) {
          
            var dateField = {
                curr_day: curr_day,
                curr_time: curr_time,
                curr_date: curr_date
            }

            switch (prop.repeat) {
                case "Weekly":
                    Logger.log("preparing Weekly:");
                    prop.notRepeatDays = prop.notRepeatDays > 0 ? addToDate('day', parseInt(prop.notRepeatDays) + 1) : 0;
                    executeWeekly(prop);
                    break;

                case "Monthly":
                    Logger.log("preparing Monthly:");
                    prop.notRepeatDays = prop.notRepeatDays > 0 ? addToDate('month', parseInt(prop.notRepeatDays) + 1) : 0;
                    executeMonthly(prop)
                    break;

                case "Yearly":
                    Logger.log("preparing Yearly:");
                    prop.notRepeatDays = prop.notRepeatDays > 0 ? addToDate('year', parseInt(prop.notRepeatDays) + 1) : 0;
                    executeYearly(prop);
                    break;
            }


        }
    }
}

function executeWeekly(prop) {
    // var curr_time = getCurrentDate('h');
    var curr_day = getCurrentDate('d');
    for (var i = 0; i < prop.repeatOn.length; i++) {
        if (curr_day == prop.repeatOn[i]) {
            Logger.log(curr_day + '-' + prop.repeatOn[i]);

            checkTimeRangeAndSend(prop);
            break;
        }
    }
}

function executeMonthly(prop) {

    var monthNum = getCurrentDate('monthNum');
    var full_date = getCurrentDate('full');
    var curr_time = getCurrentDate('h');
    var curr_day = getCurrentDate('dayNum');
    var year = getCurrentDate('y');
    Logger.log("Monthly")
    if (!isNaN(prop.repeatOn)) {
        Logger.log("Monthly number");
        var floor_days = getDaysInMonth(monthNum, year);
        prop.repeatOn = (parseInt(prop.repeatOn) > floor_days) ? floor_days : parseInt(prop.repeatOn);
        if (prop.repeatOn == curr_day) {
            Logger.log("Monthly should execute");

            checkTimeRangeAndSend(prop);
        }

    } else {
        Logger.log("Monthly not a number");
        var propWhen = prop.repeatOn.split('-')[0];
        var propWeekDay = prop.repeatOn.split('-')[1];
        var fullMonthName = getMonthFullName();
        var days = specificDays(propWeekDay, fullMonthName, year);
        var numeric = {
            "First": 0,
            "Second": 1,
            "Third": 2,
            "Fourth": 3,
            "Last": (days.length - 1)
        };
        var dayToExec = days[numeric[propWhen]];

        if (dayToExec && dayToExec == full_date) {
            Logger.log("Ready to execute %s", dayToExec)
            checkTimeRangeAndSend(prop);
        }
    }
}

function executeYearly(prop) {
    var full_date = getCurrentDate('full');
    var curr_day = getCurrentDate('dayNum');
    var fullMonthName = getMonthFullName();
    var year = getCurrentDate('y');
    if (prop.repeatOn.length <= 12) {
        Logger.log("execute Yearly , first option %s", prop.repeatOn);

        var check_date = curr_day + " " + fullMonthName;
        if (prop.repeatOn == check_date) {
            checkTimeRangeAndSend(prop);
            Logger.log(check_date);
        }
    } else {
        var propWhen = prop.repeatOn.split('-')[0];
        var propWeekDay = prop.repeatOn.split('-')[1];
        var propMonth = prop.repeatOn.split('-')[2];
        var days = specificDays(propWeekDay, propMonth, year);
        var numeric = {
            "First": 0,
            "Second": 1,
            "Third": 2,
            "Fourth": 3,
            "Last": (days.length - 1)
        };
        var dayToExec = days[numeric[propWhen]];
        Logger.log("execute Yearly , first option %s", dayToExec);
        Logger.log(days)
        if (dayToExec && dayToExec == full_date) {
            Logger.log("Ready to execute %s", dayToExec)
            checkTimeRangeAndSend(prop);
        }

    }
}

function checkTimeRangeAndSend(prop) {

    var curr_time = getCurrentDate('h');
    for (var j = 0; j < prop.betweenRange.length; j++) {
        var dif = diff_minutes(curr_time, prop.betweenRange[j]);
        Logger.log(dif)
        if (dif <= 60) {
            //            Logger.log('Ready to execute at: %s for label %s to: %s', prop.betweenRange[j], prop.label, prop.to);
            sheetLog('Ready to execute at:  ' + prop.betweenRange[j] + " for label " + prop.label);
            sendGmailDraft(prop.label, prop.to, prop.notRepeatDays);
            break;
        }
    }
}

function getJukeboxActivity() {
    var arr = [];
    var keys = PropertiesService.getScriptProperties().getProperties();
    for (var key in keys) {
        var prop = JSON.parse(PropertiesService.getScriptProperties().getProperty(key));
        if (prop.label) {
            arr.push([prop.label, prop.toggle])
        }
    }
    Logger.log(arr);
    return arr;
}

function getCurrentSheetJukeboxActivity(){
  
  var sheets = SpreadsheetApp.getActive().getSheets();
  var sheetNames = [];
  var activity = [];
  
  for(var i = 0; i < sheets.length;i++) {
    if(sheets[i].getName().indexOf('►') > -1){
      sheetNames.push(sheets[i].getName().replace('► ','Repeat Post/'));
    }
  }
  
  if(sheetNames.length > 0) {
    var keys = PropertiesService.getScriptProperties().getProperties()//.getKeys();
    var propArray = [];
    sheetLog('Sheet Count: ' + keys.length);
    for(var key in keys){
       sheetLog('Sheet Count key: ' + key);
      var prop = JSON.parse(PropertiesService.getScriptProperties().getProperty(key));
      sheetLog('Sheet prop: ' + prop.label);
      if( typeof prop.label != "undefined"){
        propArray.push([prop.label, prop.toggle])
      }
    }
    
    for(var i=0;i<sheetNames.length;i++){
      
      for(var j=0;j<propArray.length;j++){
        if( sheetNames[i] == propArray[j][0]){
          activity.push(propArray[j])
        }
      }
    }
 
    Logger.log(activity)
  }
  return activity;
}

function setJukeboxActivity(label, val) {
    //  label = "Repeat Post/kris123";val = 0;
    if (label) {
        Logger.log(label)
        label = label.split('Repeat Post/')[1].toLowerCase().trim();
        Logger.log(label)
        var props = JSON.parse(PropertiesService.getScriptProperties().getProperty(label));
        Logger.log(props)
        props.toggle = val ? 1 : 0;
        PropertiesService.getScriptProperties().setProperty(label, JSON.stringify(props));
        return true;
    }
    return false;
}


function getAttachmentFile(attachName){

  var file = DriveApp.getFilesByName(attachName)
  if(file.hasNext()){
    var fileDrive = file.next();
    Logger.log(fileDrive)
    return fileDrive
  }
  return [];
  
}

function createTrigger() {
    ScriptApp.newTrigger('triggerExecute')
        .timeBased().everyHours(1).create();
    ScriptApp.newTrigger('onOpen')
        .forSpreadsheet(SpreadsheetApp.getActive())
        .onOpen()
        .create();
}

function execTest() {
    Logger.log('Trigger executed at ' + getCurrentDate('h'))
    sheetLog('Trigger executed at ' + getCurrentDate('h'));
}


function getRandomInt(max) {
    return Math.floor(Math.random() * (max + 1));
}