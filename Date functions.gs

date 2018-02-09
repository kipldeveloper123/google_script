function getCurrentDate(check) {
    var user_timezone = getUserTimezone();
    if (check == 'm') {
        return Utilities.formatDate(new Date(), user_timezone, "MMM");
    } else if (check == 'h') {
        return to12hourFormat(Utilities.formatDate(new Date(), user_timezone, "HH:mm"));
    } else if (check == 'y') {
        return Utilities.formatDate(new Date(), user_timezone, "YYYY");
    } else if (check == 'd') {
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var date = new Date(Utilities.formatDate(new Date(), getUserTimezone(), "MM/dd/YYYY"));
        var day = date.getDay();
        return days[day];
    } else if (check == 'full') {
        return Utilities.formatDate(new Date(), user_timezone, "MM/dd/YYYY");
    } else if (check == 'monthNum') {
        return parseInt(Utilities.formatDate(new Date(), user_timezone, "MM"));
    } else if (check == 'dayNum') {
        return parseInt(Utilities.formatDate(new Date(), user_timezone, "dd"));
    }
}

function getUserTimezone() {
    return SpreadsheetApp.getActive().getSpreadsheetTimeZone();
}

function getMonthFullName() {
    var d = new Date();
    var months = ["January", "Feburary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[d.getMonth()];
};

function sundaysInMonth(m, y) {
    var d, monday = 0,
        i = 1;
    var user_timezone = getUserTimezone();
    while (monday < 4) {
        d = new Date(i++ + " March 2017");
        if (d.getDay() == 2) {
            monday++;
        }
    }

    Logger.log(Utilities.formatDate(d, user_timezone, "MM/dd/YYYY"))
}

function specificDays(dayName, monthName, year) {
    // set names
    var monthNames = ["January", "February", "March",
        "April", "May", "June",
        "July", "August", "September",
        "October", "November", "December"
    ];
    var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];

    // change string to index of array
    var day = dayNames.indexOf(dayName);
    var month = monthNames.indexOf(monthName) + 1;
    // determine the number of days in month
    var daysinMonth = new Date(year, month, 0).getDate();
    // set counter
    var sumDays = 0;
    var arr = [];
    // iterate over the days and compare to day
    for (var i = 1; i <= daysinMonth; i++) {
        var checkDay = new Date(year, month - 1, parseInt(i)).getDay();
        if (day == checkDay) {
            arr.push(Utilities.formatDate(new Date(year, month - 1, parseInt(i)), getUserTimezone(), "MM/dd/YYYY"))
            sumDays++;
        }
    }

    // show amount of day names in month
    return arr;
}

function getDaysInMonth(m, y) {
    return m === 2 ? y & 3 || !(y % 25) && y & 15 ? 28 : 29 : 30 + (m + (m >> 3) & 1);
}


function to12hourFormat(time) {
    var ts = time;
    var H = +ts.substr(0, 2);
    var h = (H % 12) || 12;
    h = (h < 10) ? ("0" + h) : h; // leading 0 at the left for 1 digit hours
    var ampm = H < 12 ? " AM" : " PM";
    ts = h + ts.substr(2, 3) + ampm;
    return ts;
}

function convertTime12to24(time12h) {
    var time = time12h.split(' ')[0];
    var modifier = time12h.split(' ')[1];
    var hours = time.split(':')[0];
    var minutes = time.split(':')[1];

    if (hours === '12') {
        hours = '00';
    }
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }
    return hours + ':' + minutes;
}


var makeTimeIntervals = function(startTime, endTime, increment) {
    startTime = startTime.toString().split(':');
    endTime = endTime.toString().split(':');
    increment = parseInt(increment, 10);
  
    var pad = function(n) {
            return (n < 10) ? '0' + n.toString() : n;
        },
        startHr = parseInt(startTime[0], 10),
        startMin = parseInt(startTime[1], 10),
        endHr = parseInt(endTime[0], 10),
        endMin = parseInt(endTime[1], 10),
        currentHr = startHr,
        currentMin = startMin,
        previous = currentHr + ':' + pad(currentMin),
        current = '',
        r = [];
  Logger.log("start " + startHr + " End " + endHr)

    do {
        currentMin += increment;
        if ((currentMin % 60) === 0 || currentMin > 60) {
            currentMin = (currentMin === 60) ? 0 : currentMin - 60;
            currentHr += 1;
        }
        current = (currentHr < 10 ? '0' + currentHr : currentHr) + ':' + pad(currentMin);
        //            r.push(previous + ' - ' + current);
        r.push(current);
        previous = current;
    } while (currentHr !== endHr);

    return r;
};

function getTimeIntervals(start, end, count) {
    try {
        sheetLog('enter getTimeIntervals');
        sheetLog('convert timeS: ' + start);
        sheetLog('convert timeE: ' + end);
        var a = makeTimeIntervals(convertTime12to24(start), convertTime12to24(end), 60);
        return splitUp(a, count);
    } catch (e) {
        Logger.log(e.toString());
        sheetLog('err getTimeIntervals: ' + e.toString());
        return [];
    }
}

function testInterval(){
  
  //Logger.log(getTimeIntervals('01:00 AM', '12:00 AM', 3))
  Logger.log(convertTime12to24('01:00 AM') > convertTime12to24('2:00 AM'))
}

function compareHours(hour1, hour2){

return convertTime12to24(hour1) > convertTime12to24(hour2);
}


function splitUp(arr, n) {
    var rest = arr.length % n,
        restUsed = rest,
        partLength = Math.floor(arr.length / n),
        result = [];

    for (var i = 0; i < arr.length; i += partLength) {
        var end = partLength + i,
            add = false;

        if (rest !== 0 && restUsed) {
            end++;
            restUsed--;
            add = true;
        }
        var sl = arr.slice(i, end);
        // console.log(sl);
        result.push(to12hourFormat(sl[sl.length - 1]));

        if (add) {
            i++;
        }
    }
    return result;
}

function diff_minutes(time1, time2) {

    var dt1 = new Date(getCurrentDate('full') + ' ' + time1);
    var dt2 = new Date(getCurrentDate('full') + ' ' + time2);
    if (dt2.getTime() >= dt1.getTime()) {
        var diff = (dt2.getTime() - dt1.getTime()) / 1000;
        diff /= 60;
        return Math.abs(Math.round(diff));
    }
    return 500;
}

function checkMonthIsGreater(date2) {
    var dt1 = new Date(getCurrentDate('full') );
    var dt2 = new Date( date2 );
   
    if (dt2.getTime() >= dt1.getTime()) {
        var diff = (dt2.getTime() - dt1.getTime()) / 1000;
        diff /= 60;
        return true;
    }
  return false;
}

function addToDate( switchVal , value ) {
 
  var result = new Date(getCurrentDate('full'));
  if(switchVal == 'day'){
    var user_timezone = getUserTimezone();
    result.setDate(result.getDate() + value);
    return Utilities.formatDate(new Date(result), user_timezone, "MM/dd/YYYY");
  }
  else if(switchVal == 'month'){
    result.setMonth(result.getMonth() + value);
    return Utilities.formatDate(new Date(result), user_timezone, "MM/dd/YYYY");
  }
  else if(switchVal == 'year'){
    result.setFullYear(result.getFullYear() + value);
    return Utilities.formatDate(new Date(result), user_timezone, "MM/dd/YYYY");
  }
}

function checkMidnight(){
  var startTime = '00:00 AM';
  var endTime   = '01:00 AM';
  
  var now       = new Date();
  var startDate = dateObj(startTime);
  var endDate   = dateObj(endTime);
  
  var open = now < endDate && now > startDate ? 'true' : 'false';
  return open;
}

function dateObj(d) {
    var parts = d.split(/:|\s/),
        date  = new Date();
    if (parts.pop().toLowerCase() == 'pm') parts[0] = (+parts[0]) + 12;
    date.setHours(+parts.shift());
    date.setMinutes(+parts.shift());
    return date;
}

function getEndTrialPeriod(){
  var date = new Date();
  var user_timezone = getUserTimezone();
  var numberOfDaysToAdd = 31;
  date.setDate(date.getDate() + numberOfDaysToAdd); 
 
  return Utilities.formatDate(date, user_timezone, "MM/dd/YYYY");
 
}
