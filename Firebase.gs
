var Firebase_URL = 'https://gumroad-user-db.firebaseio.com/';
var Firebase_Secret = 'XzDVLCkF8ZEujetIqitTa1BT3n8pS6FQ4psyMGPT';

//var Firebase_URL = 'https://api-project-256922713879.firebaseio.com/';
//var Firebase_Secret = '0P2zzZR2FK11YQKcddPyzskgU7ndcfX4pIDnGEW6';

function getFBData() {
    var fb = FirebaseApp.getDatabaseByUrl(Firebase_URL, Firebase_Secret);
    Logger.log(fb.getData("users"));
    return fb.getData("users");
}

function setFBData(email, status) {

    var fb = FirebaseApp.getDatabaseByUrl(Firebase_URL, Firebase_Secret);
    var data = fb.getData("users");
    email = stripEmail(email);
    data[email] = {
        status: status
    };
    fb.setData("users", data)

    setSubscribedEmailUserProp(email, status);
}

function getFBDataByEmail(email) {
    var fb = FirebaseApp.getDatabaseByUrl(Firebase_URL, Firebase_Secret);
    var data = fb.getData("users/" + stripEmail(email) + "");
    //  Logger.log(data);
    return data;
}

function setSubscribedEmailUserProp(email, status) {

    email = stripEmail(email);
    var key = "license" + email;
    var data = PropertiesService.getUserProperties().getProperty(key);
    PropertiesService.getUserProperties().setProperty(key, JSON.stringify({
        status: status
    }));
    return true;
}

function getSubscribedEmailUserProp(email) {

    email = stripEmail(email);
    var key = "license" + email;
    Logger.log(PropertiesService.getUserProperties().getProperty(key))
    return JSON.parse(PropertiesService.getUserProperties().getProperty(key));
}

function updateUserSubscription() {
    if (checkMidnight()) {
        var email = Session.getEffectiveUser().getEmail();
        var data = getSubscribedEmailUserProp(email);
        Logger.log(data)
        if (data != null) {
            if (typeof data.status === "object" && typeof data.status.Trial != "undefined") {
                if (!checkMonthIsGreater(data.status.Trial)) {
                    setFBData(email, "Expired")
                }
            }
        }
    }
}

function stripEmail(email) {
    email = email.toLowerCase();
    email = email.replace(/[^a-z0-9]/g, "");
    return email;
}