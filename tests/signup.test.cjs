const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const filename = require.resolve("../src/lib/signup.ts");
const signupModule = new Module(filename, module);
signupModule._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  filename,
);
const { getSignupError, getSignupMetadata, isAdult } = signupModule.exports;

const valid = {
  fullName: " Party Guest ",
  email: "guest@example.com",
  dateOfBirth: "1990-01-02",
  password: "a-password",
  confirmPassword: "a-password",
  agreed: true,
};

test("accepts the exact 18th birthday and rejects one day younger", () => {
  const today = new Date("2026-11-22T12:00:00Z");
  assert.equal(isAdult("2008-11-22", today), true);
  assert.equal(isAdult("2008-11-23", today), false);
});

test("rejects missing, malformed, impossible and future birthdays", () => {
  const today = new Date("2026-11-22T12:00:00Z");
  for (const dob of [
    "",
    "1990-1-02",
    "not-a-date",
    "2000-02-30",
    "1990-13-01",
    "2030-01-01",
  ])
    assert.equal(isAdult(dob, today), false, dob);
});

test("handles leap-day birthdays using the website's calendar rule", () => {
  assert.equal(isAdult("2008-02-29", new Date("2026-02-28T12:00:00Z")), false);
  assert.equal(isAdult("2008-02-29", new Date("2026-03-01T12:00:00Z")), true);
  assert.equal(isAdult("2007-02-29", new Date("2026-03-01T12:00:00Z")), false);
});

test("uses the same UTC birthday boundary as the website", () => {
  const today = new Date("2026-11-23T00:30:00+08:00");
  assert.equal(isAdult("2008-11-22", today), true);
  assert.equal(isAdult("2008-11-23", today), false);
});

test("requires an adult birthday and explicit consent", () => {
  assert.match(
    getSignupError({ ...valid, dateOfBirth: "" }),
    /valid date of birth/,
  );
  const today = new Date();
  const minorBirthday = `${today.getUTCFullYear() - 10}-01-01`;
  assert.match(
    getSignupError({ ...valid, dateOfBirth: minorBirthday }),
    /18 or older/,
  );
  assert.match(
    getSignupError({ ...valid, agreed: false }),
    /Accept the data collection notice/,
  );
  assert.equal(getSignupError(valid), "");
});

test("requires name, valid email and matching eight-character passwords", () => {
  assert.match(getSignupError({ ...valid, fullName: " " }), /full name/);
  assert.match(getSignupError({ ...valid, email: "guest@" }), /valid email/);
  assert.match(getSignupError({ ...valid, password: "short" }), /8 characters/);
  assert.match(
    getSignupError({ ...valid, confirmPassword: "different" }),
    /don't match/,
  );
});

test("sends the metadata required by the website's profile trigger", () => {
  assert.deepEqual(getSignupMetadata(valid), {
    name: "Party Guest",
    full_name: "Party Guest",
    date_of_birth: "1990-01-02",
    accept_terms: true,
    consent_version: "2026-01",
  });
});
