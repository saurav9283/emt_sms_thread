var SMS_PREFIX = `Congratulations! You've earned
<POINTS> points and qualified for the
daily draw upon your subscription
for Football Trivia daily.
Earn more points and stand better
chances of winning upto 60
Million Naira andAirtime.`;

var one_incorrect = `Sorry, let's try again. Gather more to 
stand a chance to win today if you answer the next question correctly.
`;

var one_correct = `Congratulations, you now have <POINTS> points.
 Gather more to stand a chance to win today!`;

var all_incorrect = `
oops, you’ve failed again.
Reply with MORE to earn more
points and stand a better chance
of winning cash prizes and
airtime. You will be charged
N50/Game.
`;

var all_correct = `
Congratulations! You've earned
<POINTS> points and qualified for
today's draw. You will be notified
of the result by SMS.
Reply with MORE too earn more
points and stand a better chance
of winning cash prizes and
airtime. You will be charged
N50/Game.
`;

var second_correct = `
Congratulations! You've earned
<POINTS> points and qualified for
today's draw. You will be notified
of the result by SMS.
Reply with MORE too earn more
points and stand a better chance
of winning cash prizes and
airtime. You will be charged
N50/Game
`;

var tomorow = `
Sorry, let's try again tomorrow. You can also gather more points by sending PLAY to 20782
`;
function sms_type_handle(correct) {
  console.log("INSIDE TYPE HANDLE")
  switch (true) {
    case correct.FIRST == "1" && correct.SECOND == "1":
      type_handle = "all_correct";
      return;

    case correct.FIRST == "0" && correct.SECOND == "0":
      type_handle = "all_incorrect";
      return;

    case correct.SECOND == 0:
      type_handle = "tomorow";
      return;

    case correct.SECOND == "1":
      type_handle = "second_correct";
      return;

    case correct.FIRST == "0":
      type_handle = "one_incorrect";
      return;

    case correct.FIRST == "1":
      type_handle = "one_correct";
      return;

    default:
      return "";
    // Handle the default case if none of the conditions match.
  }
}

function handleSmsType(type, points, message) {
  console.log({
    type,
    points,
    message,
  });
  switch (type) {
    case "one_correct":
      return one_correct.replace("<POINTS>", points) + " " + message;

    case "one_incorrect":
      return one_incorrect + " " + message;

    case "all_incorrect":
      return all_incorrect;

    case "all_correct":
      return all_correct.replace("<POINTS>", points);

    case "second_correct":
      return second_correct.replace("<POINTS>", points);

    case "tomorow":
      return tomorow;

    default:
      return SMS_PREFIX.replace("<POINTS>", points) + " " + message;
  }
}


module.exports = {
    sms_type_handle,
    handleSmsType,
    
}