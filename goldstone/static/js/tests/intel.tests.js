/**
 * Created by stanford on 3/12/14.
 */

test( "hello test", function() {
  ok( 1 == "1", "Passed!" );
});

/*test( "hello test", function() {
  ok( 2 == "1", "Passed!" );
});*/

test("Add time to date (in seconds)", function () {
    var d = new Date(),
        dPlus = new Date(d.getTime())
    dPlus.addSeconds(1)
    ok(d.getTime() + 1000 === dPlus.getTime(), "Passed!")
})

test("Subtract from date (in seconds)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addSeconds(-1)
    ok(d.getTime() - 1000 === dMinus.getTime(), "Passed!")
})

test("Add 0 to date (in seconds)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addSeconds(0)
    ok(d.getTime() === dMinus.getTime(), "Passed!")
})

test("Add time to date (in minutes)", function () {
    var d = new Date(),
        dPlus = new Date(d.getTime())
    dPlus.addMinutes(1)
    ok(d.getTime() + (60 * 1000) === dPlus.getTime(), "Passed!")
})

test("Subtract from date (in minutes)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addMinutes(-1)
    ok(d.getTime() - (60 * 1000) === dMinus.getTime(), "Passed!")
})

test("Add 0 to date (in minutes)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addMinutes(0)
    ok(d.getTime() === dMinus.getTime(), "Passed!")
})

test("Add time to date (in hours)", function () {
    var d = new Date(),
        dPlus = new Date(d.getTime())
    dPlus.addHours(1)
    ok(d.getTime() + (60 * 60 * 1000) === dPlus.getTime(), "Passed!")
})

test("Subtract from date (in hours)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addHours(-1)
    ok(d.getTime() - (60 * 60 * 1000) === dMinus.getTime(), "Passed!")
})

test("Add 0 to date (in hours)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addHours(0)
    ok(d.getTime() === dMinus.getTime(), "Passed!")
})


test("Add time to date (in days)", function () {
    var d = new Date(),
        dPlus = new Date(d.getTime())
    dPlus.addDays(1)
    ok(d.getTime() + (24 * 60 * 60 * 1000) === dPlus.getTime(), "Passed!")
})

test("Subtract from date (in days)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addDays(-1)
    ok(d.getTime() - (24 * 60 * 60 * 1000) === dMinus.getTime(), "Passed!")
})

test("Add 0 to date (in days)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addDays(0)
    ok(d.getTime() === dMinus.getTime(), "Passed!")
})

test("Add time to date (in weeks)", function () {
    var d = new Date(),
        dPlus = new Date(d.getTime())
    dPlus.addWeeks(1)
    ok(d.getTime() + (7 * 24 * 60 * 60 * 1000) === dPlus.getTime(), "Passed!")
})

test("Subtract from date (in weeks)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addWeeks(-1)
    ok(d.getTime() - (7 * 24 * 60 * 60 * 1000) === dMinus.getTime(), "Passed!")
})

test("Add 0 to date (in weeks)", function () {
    var d = new Date(),
        dMinus = new Date(d.getTime())
    dMinus.addWeeks(0)
    ok(d.getTime() === dMinus.getTime(), "Passed!")
})

test("Testing populateSettingsFields", function () {
    var s = new Date(2014, 1, 1, 1, 1, 1),
        e = new Date(2014, 2, 2, 2, 2, 2),
        sInput = '<input id="settingsStartTime" type="text" hidden="true">',
        eInput = '<input id="settingsEndTime" type="text" hidden="true">',
        fs,
        fe

    $('#transientElements').append(sInput)
    $('#transientElements').append(eInput)
    populateSettingsFields(s, e)
    fs = $("input#settingsStartTime").val()
    fe = $("input#settingsEndTime").val()
    ok(s.getTime() === (new Date(fs)).getTime(), "Start date passed!")
    ok(e.getTime() === (new Date(fe)).getTime(), "End date passed!")
    $('#settingsStartTime').remove()
    $('#settingsEndTime').remove()
})