"use strict";

const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");

async function load(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

(async () => {
  const {
    WORLD_CLOCK_DEFAULT_MINUTES_PER_SECOND,
    WorldClock,
    dueTimeEvents,
    repeatingTimeEvents
  } = await load("src/systems/world-clock.js");

  assert.equal(WORLD_CLOCK_DEFAULT_MINUTES_PER_SECOND, 1, "default clock speed should stay slow: 1 game minute per real second");
  assert.equal(repeatingTimeEvents.length, 4, "first clock contract should keep the four planned repeating events");

  const clock = new WorldClock();
  assert.equal(clock.minutesPerSecond, WORLD_CLOCK_DEFAULT_MINUTES_PER_SECOND, "WorldClock should use the exported default speed");
  assert.equal(clock.snapshot().timeText, "08:00", "default clock should start at 08:00");
  assert.equal(clock.update(0.99), false, "sub-minute carry should not advance visible game time");
  assert.equal(clock.snapshot().timeText, "08:00", "clock should not advance before one game minute has accumulated");
  assert.equal(clock.update(0.01), true, "one real second should advance one game minute at default speed");
  assert.equal(clock.snapshot().timeText, "08:01", "default clock speed should advance to 08:01 after one real second");

  const fastClock = new WorldClock({ startHour: 18, startMinute: 59, minutesPerSecond: 60 });
  const previousMinute = fastClock.minuteOfDay;
  assert.equal(fastClock.update(1), true, "custom fast clocks should still be possible for tests");
  assert.equal(fastClock.snapshot().timeText, "19:59", "custom speed should advance by 60 game minutes");
  assert.deepEqual(dueTimeEvents(previousMinute, fastClock.minuteOfDay).map((event) => event.id), ["casino-peak"], "crossing 19:00 should trigger casino peak");

  assert.ok(dueTimeEvents(1379, 10).some((event) => event.id === "night-rumor"), "event crossing should work across midnight");

  console.log("World clock smoke check passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
