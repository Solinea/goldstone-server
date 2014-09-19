//---------------------------
// begin time mock graph update tester
// a convenient way to test backbone re-rendering of
// charts which is triggered by chart data update


// function to create urls that advance at adjustable rates
var timeMock = function() {
    // enter unix time/1000 of start moment
    var urlNumBase = 1407617849;
    // sets the end time to about 75 minutes to the start time
    var urlNumBase2 = urlNumBase + 4592;
    return function() {
        // advances 4 minutes per invocation
        var advanceRate = 240;
        urlNumBase += advanceRate;
        urlNumBase2 += advanceRate;
        // returns new url to query for data payload
        var result = "/cinder/api_perf?start=" + urlNumBase + "&end=" + urlNumBase2 + "&interval=120s&render=false";
        return result;
    };
};
var timeAdvancer = timeMock();


var graphUpdater = setInterval(function() {
    // call timeAdvancer which stores the urlNumBase in a closure scope
    var newTime = timeAdvancer();

    novaApiPerfChart.url = newTime;
    console.log('fetching again', novaApiPerfChart.url);
    novaApiPerfChart.fetch({
        success: function(data) {}
    });

    keystoneApiPerfChart.url = newTime;
    console.log('fetching again', keystoneApiPerfChart.url);
    keystoneApiPerfChart.fetch({
        success: function(data) {}
    });

}, 2000);
setTimeout(function() {
    console.log('auto update interval cleared');
    clearInterval(graphUpdater);
}, 30000);

// end time mock graph update tester
//---------------------------
