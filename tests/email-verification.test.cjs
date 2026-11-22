const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

function loadTs(file, mocks) {
  const module = { exports: {} };
  const output = ts.transpileModule(
    fs.readFileSync(require.resolve(file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  new Function("exports", "require", "module", output)(
    module.exports,
    (name) => (Object.hasOwn(mocks, name) ? mocks[name] : require(name)),
    module,
  );
  return module.exports;
}

function verification(auth = {}) {
  let stored = null;
  const storage = {
    getItem: async () => stored,
    setItem: async (_key, value) => {
      stored = value;
    },
    removeItem: async () => {
      stored = null;
    },
  };
  const api = loadTs("../src/lib/email-verification.ts", {
    "@react-native-async-storage/async-storage": storage,
    "@/lib/supabase": { supabase: { auth } },
  });
  return { ...api, stored: () => stored, storage };
}

test("signup email codes are verified with the right Supabase type and clear the pending email", async () => {
  const api = verification({
    verifyOtp: async (input) => {
      assert.deepEqual(input, {
        email: "guest@example.com",
        token: "123456",
        type: "signup",
      });
      return {
        error: null,
        data: {
          user: { email_confirmed_at: "confirmed" },
          session: { user: { email_confirmed_at: "confirmed" } },
        },
      };
    },
  });
  await api.rememberPendingEmail("guest@example.com", Date.now());
  await api.verifySignupCode(" guest@example.com ", " 123456 ");
  assert.equal(api.stored(), null);
});

test("malformed codes and email addresses are rejected before contacting Supabase", async () => {
  const api = verification({
    verifyOtp: () => {
      throw new Error("Unexpected auth request");
    },
  });
  await assert.rejects(
    api.verifySignupCode("invalid", "123456"),
    /email address/,
  );
  for (const code of ["", "12345", "1234567", "12x456"])
    await assert.rejects(
      api.verifySignupCode("guest@example.com", code),
      /6-digit/,
    );
});

test("wrong or expired codes retain the pending account and explain how to retry", async () => {
  const api = verification({
    verifyOtp: async () => ({ error: { code: "otp_expired" }, data: {} }),
  });
  await api.rememberPendingEmail("guest@example.com");
  await assert.rejects(
    api.verifySignupCode("guest@example.com", "000000"),
    /Invalid or expired/,
  );
  assert.equal((await api.readPendingEmail()).email, "guest@example.com");
});

test("confirmation needs a confirmed user and session, not just a successful HTTP response", async () => {
  const api = verification({
    verifyOtp: async () => ({
      error: null,
      data: { user: { email_confirmed_at: "confirmed" }, session: null },
    }),
  });
  await assert.rejects(
    api.verifySignupCode("guest@example.com", "123456"),
    /could not be confirmed/,
  );
  assert.equal(api.confirmedSession(null), null);
  assert.equal(api.confirmedSession({ user: {} }), null);
  const session = { user: { email_confirmed_at: "confirmed" } };
  assert.equal(api.confirmedSession(session), session);
});

test("resend uses signup confirmation and remembers only the email and resend time", async () => {
  const api = verification({
    resend: async (input) => {
      assert.deepEqual(input, { email: "guest@example.com", type: "signup" });
      return { error: null };
    },
  });
  const sentAt = await api.resendSignupCode(" guest@example.com ");
  assert.deepEqual(JSON.parse(api.stored()), {
    email: "guest@example.com",
    sentAt,
  });
  await api.rememberPendingEmail("guest@example.com");
  assert.equal((await api.readPendingEmail()).sentAt, sentAt);
  assert.equal(api.resendSecondsRemaining(sentAt, sentAt), 60);
  assert.equal(api.resendSecondsRemaining(sentAt, sentAt + 15000), 45);
  assert.equal(api.resendSecondsRemaining(sentAt, sentAt + 61000), 0);
});

test("resend failures do not claim to send a new code", async () => {
  const api = verification({
    resend: async () => ({ error: { message: "Email rate limit exceeded" } }),
  });
  await assert.rejects(api.resendSignupCode("guest@example.com"), /rate limit/);
  assert.equal(api.stored(), null);
});

test("a corrupt saved pending email does not block code entry", async () => {
  const api = verification();
  await api.storage.setItem("unused", "not-json");
  assert.equal(await api.readPendingEmail(), null);
  await api.storage.setItem("unused", JSON.stringify({ email: "invalid" }));
  assert.equal(await api.readPendingEmail(), null);
});

function signInHandler(file, name, extra = {}) {
  const source = fs.readFileSync(require.resolve(file), "utf8");
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const screen = ast.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === "SignIn",
  );
  const handler = screen.body.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
  const output = ts.transpileModule(handler.getText(ast), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const calls = { navigation: [], problems: [], remembered: [], signOut: 0 };
  const state = {
    busy: false,
    creating: true,
    fullName: "Guest",
    email: "guest@example.com",
    password: "password1",
    confirm: "password1",
    confirmPassword: "password1",
    dateOfBirth: "1990-01-01",
    agreed: true,
    setBusy: () => {},
    setProblem: (value) => calls.problems.push(value),
    setNotice: () => {},
    setPassword: () => {},
    setConfirm: () => {},
    setConfirmPassword: () => {},
    getSignupError: () => "",
    getSignupMetadata: () => ({ date_of_birth: "1990-01-01" }),
    rememberPendingEmail: async (...args) => calls.remembered.push(args),
    isUnconfirmedEmailError: (error) => error?.code === "email_not_confirmed",
    router: { push: (value) => calls.navigation.push(value) },
    supabase: {
      auth: {
        signUp: async () => ({ error: null, data: { session: null } }),
        signOut: async () => {
          calls.signOut++;
        },
      },
    },
    ...extra,
  };
  return {
    calls,
    run: new Function(...Object.keys(state), output + `;return ${name};`)(
      ...Object.values(state),
    ),
  };
}

test("both mobile and web signup handlers open code entry after signup", async () => {
  for (const [file, name] of [
    ["../src/components/sign-in.native.tsx", "handleSignup"],
    ["../src/components/sign-in.tsx", "submit"],
  ]) {
    const { calls, run } = signInHandler(file, name);
    await run();
    assert.equal(calls.remembered[0][0], "guest@example.com");
    assert.equal(calls.navigation[0].pathname, "/verify-email");
    assert.equal(calls.navigation[0].params.email, "guest@example.com");
  }
});

test("existing unconfirmed accounts can reach code entry from login", async () => {
  for (const [file, name] of [
    ["../src/components/sign-in.native.tsx", "handleLogin"],
    ["../src/components/sign-in.tsx", "submit"],
  ]) {
    const { calls, run } = signInHandler(file, name, {
      creating: false,
      supabase: {
        auth: {
          signInWithPassword: async () => ({
            error: {
              code: "email_not_confirmed",
              message: "Email not confirmed",
            },
          }),
        },
      },
    });
    await run();
    assert.equal(calls.navigation[0].pathname, "/verify-email");
    assert.deepEqual(calls.problems, [""]);
  }
});
