/* GLOBAL VARIABLES */

// to keep of record of angles of diff needles
let sAngle = 00,
  mAngle = 00,
  hAngle = 00,
  msAngle = 00;

// to keep of record of values of seconds, mins, hours
let sVal = 0,
  mVal = 0,
  hVal = 0;

let totalInterval = 60;

// one tick of clock is 6 deg as => 360 / 60 = 6
const oneTick = 6;

// one tick of clock is 0.36 deg for ms as => 360 / 1000 = 0.36
const oneTickForMS = 9;

// to control setInterval callbacks
let secInterval, minInterval, hourInterval, msInterval;

// to control setTimeout callbacks
let minTimeOut, hourTimeOut;

// to store details of laps
let laps = [];

/* HELPER FUNCTIONS */

// to set current values of time to the digital clock
const setDigitalTime = () => {
  const digitalTimeDiv = document.querySelector(".digital-time");
  digitalTimeDiv.innerHTML = transformTimeString(hVal, mVal, sVal);
};

// to change text, css class, event handler of the button
const changeButton = (text, beforeClass, afterClass, clickListener) => {
  const btn = document.querySelector(`.${beforeClass}-button`);
  if (btn) {
    btn.innerHTML = text;
    btn.onclick = clickListener;
    btn.classList.replace(`${beforeClass}-button`, `${afterClass}-button`);
  } else {
    console.log("Can't target the button-" + beforeClass);
  }
};

// rotate specified needle
const rotate = (needle, angle) => {
  var div = document.getElementById(needle);
  div.style.transform = "rotate(" + angle + "deg)";
};

// to rotate min needle and increase counters
const moveMinuteNeedle = () => {
  mAngle = mAngle + oneTick;
  mVal++;
  rotate("minutes", mAngle);
};

// to rotate hour needle and increase counters
const moveHourNeedle = () => {
  hAngle = hAngle + oneTick;
  hVal++;
  rotate("hours", hAngle);
};

// to generate format like '00 : 00 : 00'
const transformTimeString = (h, m, s) =>
  `${makeDoubleDigit(h)} : ${makeDoubleDigit(m)} : ${makeDoubleDigit(s)}`;

// to transform single digit values to double digits
const makeDoubleDigit = n => (n < 10 ? "0" + n : n);

// to render laps
const renderLaps = () => {
  const list = document.querySelector(".laps-list");

  // set list to empty
  list.innerHTML = "";

  // no laps message if no laps are there
  if (laps.length < 1) {
    list.innerHTML = "<p class='no-lap-msg'>No Laps Created</p>";
    return;
  }

  // to generate laps list
  for (let i = 0; i < laps.length; i++) {
    const { hours, minutes, seconds } = laps[i];
    const div = document.createElement("div");

    div.innerHTML = `${transformTimeString(
      hours,
      minutes,
      seconds
    )} <i class="fas fa-times" onclick=remove(${i},1)></i>`;
    div.classList.add("laps-list-item");
    list.appendChild(div);
    list.scrollTo(0, list.scrollHeight);
  }
};

const saveStateToLocalStorage = running => {
  localStorage.setItem(
    "stop-watch",
    JSON.stringify({
      laps,
      sVal,
      mVal,
      hVal,
      msAngle,
      running
    })
  );
};

/* EVENT HANDLERS */

// to fetch state of local storage on refresh and initialize vars accordingly
const restoreState = () => {
  const state = JSON.parse(localStorage.getItem("stop-watch"));
  if (state) {
    laps = state.laps;
    sVal = state.sVal;
    mVal = state.mVal;
    hVal = state.hVal;
    msAngle = state.msAngle;

    // calculating angles by multiplying values with displacement of one tick
    sAngle = sVal * oneTick;
    mAngle = mVal * oneTick;
    hAngle = hVal * oneTick;

    // rotating needles w.r.t. to previous state
    rotate("milli-seconds", msAngle);
    rotate("seconds", sAngle);
    rotate("minutes", mAngle);
    rotate("hours", hAngle);

    // adjust digital clock state w.r.t. to previous state
    setDigitalTime();

    // continue prev state of the stop watch, i.e running OR paused
    if (state.running) start();
    else pause();
  }

  // to render laps if available, else show message
  renderLaps();
};

const start = () => {
  // to change buttons' text, class and event handlers
  changeButton("Lap", "disabled", "laps", lap);
  changeButton("Pause", "start", "pause", pause);

  msInterval = setInterval(() => {
    msAngle = msAngle + oneTickForMS;
    rotate("milli-seconds", msAngle);
  }, 25);

  // to move min needle after 'totalInterval - sVal' seconds
  minTimeOut = setTimeout(() => {
    // reset values on 60 min
    if (mVal === 60) mAngle = mVal = 00;

    moveMinuteNeedle();

    // rotate min needle after every 60 sec
    minInterval = setInterval(() => {
      moveMinuteNeedle();
    }, 60000);
  }, (totalInterval - sVal) * 1000);

  // to move sec needle
  secInterval = setInterval(() => {
    // to rotate sec needle and increase counters
    sAngle = sAngle + oneTick;
    sVal++;

    // reset values on 60 sec
    if (sVal === 60) sAngle = sVal = 00;

    rotate("seconds", sAngle);

    // adjust digital time clock every second
    setDigitalTime();

    // save current state of the clock every second while clock is running  (with true flag)
    saveStateToLocalStorage(true);
  }, 1000);

  // to move hour needle after 'totalInterval - mVal' minutes
  hourTimeOut = setTimeout(() => {
    // reset values on 99 hours
    if (hVal === 99) hAngle = hVal = 00;

    moveHourNeedle();

    // rotate hour needle after every 3600000 sec (60 min)
    hourInterval = setInterval(() => {
      moveHourNeedle();
    }, 3600000);
  }, (totalInterval - mVal) * 60 * 1000);
};

const pause = () => {
  // stop all the async activities
  clearInterval(secInterval);
  clearInterval(minInterval);
  clearInterval(hourInterval);
  clearInterval(msInterval);
  clearTimeout(minTimeOut);
  clearTimeout(hourTimeOut);

  // to change buttons' text, class and event handlers
  changeButton("Start", "pause", "start", start);
  changeButton("Lap", "laps", "disabled", () => {});

  // save current state of the clock when clock is stopped (with false flag)
  saveStateToLocalStorage(false);
};

// to push current clock state in the laps array
const lap = () => {
  laps.push({
    seconds: sVal,
    minutes: mVal,
    hours: hVal
  });
  renderLaps();
};

// to remove specified lap(s) from the laps array
const remove = (i, length) => {
  laps.splice(i, length);
  renderLaps();
};

// to reset clock state
const reset = () => {
  // set counters to zero
  sAngle = mAngle = hAngle = msAngle = sVal = mVal = hVal = 00;

  // empty out the laps array
  remove(0, laps.length);

  // render empty laps list (it would render the no laps message)
  renderLaps();

  // stop clock and change state of buttons
  pause();

  // move needles back to initial state
  rotate("milli-seconds", 0);
  rotate("seconds", 0);
  rotate("minutes", 0);
  rotate("hours", 0);

  // clear local storage values
  localStorage.removeItem("stop-watch");

  // set digital clock to initial state
  setDigitalTime();
};
