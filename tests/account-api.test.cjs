const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

function loadAccountModule(file, mocks) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(require.resolve(file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const boundaryRequire = (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name);
  new Function("exports", "require", "module", "fetch", "FormData", source)(
    module.exports, boundaryRequire, module, mocks.fetch, mocks.FormData ?? FormData,
  );
  return module.exports;
}

class NativeFormData {
  constructor() { this.fields = new Map(); }
  append(name, value) { this.fields.set(name, value); }
  get(name) { return this.fields.get(name); }
}

class NativeFile {
  constructor(uri) { this.uri = uri; }
  async bytes() { return new Uint8Array([1, 2, 3]); }
}

function accountApi({ platform = "android", session = true, fetch } = {}) {
  return loadAccountModule("../src/lib/account-api.ts", {
    "expo-file-system": { File: NativeFile },
    "react-native": { Platform: { OS: platform } },
    "@/lib/supabase": { supabase: { auth: { getSession: async () => ({
      data: { session: session ? { access_token: "test-access-token" } : null }, error: null,
    }) } } },
    FormData: platform === "web" ? FormData : NativeFormData,
    fetch,
  });
}

const image = { uri: "file:///temporary/id.png", mimeType: "image/png", base64: "AQID" };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("native ID submission sends authenticated multipart data without setting a boundary", async () => {
  const api = accountApi({ fetch: async (url, init) => {
    assert.ok(url.endsWith("/api/verification"));
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer test-access-token");
    assert.equal(init.headers["Content-Type"], undefined);
    assert.equal(init.body.get("idType"), "student");
    const file = init.body.get("image");
    assert.ok(file instanceof NativeFile);
    assert.equal(file.uri, image.uri);
    assert.deepEqual(await file.bytes(), new Uint8Array([1, 2, 3]));
    assert.equal(init.body.get("userId"), undefined);
    return response({ ok: true, message: "Under review" }, 201);
  } });
  assert.equal((await api.submitIdentity("student", image)).message, "Under review");
});

test("web ID submission includes real image bytes in its multipart file", async () => {
  const api = accountApi({ platform: "web", fetch: async (_url, init) => {
    const file = init.body.get("image");
    assert.equal(file.type, "image/png");
    assert.deepEqual(new Uint8Array(await file.arrayBuffer()), new Uint8Array([1, 2, 3]));
    return response({ ok: true });
  } });
  await api.submitIdentity("government", image);
});

test("profile updates send editable fields and surface server field errors", async () => {
  const api = accountApi({ fetch: async (url, init) => {
    assert.ok(url.endsWith("/api/profile"));
    assert.equal(init.method, "PATCH");
    assert.equal(init.body.get("name"), "New name");
    assert.equal(init.body.get("phone"), "09171234567");
    assert.equal(init.body.get("hostName"), "My brand");
    assert.equal(init.body.get("tier"), undefined);
    return response({ ok: false, message: "Fix the highlighted fields.", fieldErrors: { phone: "Invalid phone" } }, 400);
  } });
  await assert.rejects(api.updateAccountProfile({ name: "New name", phone: "09171234567", hostName: "My brand", avatar: null }), (error) => {
    assert.ok(error instanceof api.AccountApiError);
    assert.equal(error.fieldErrors.phone, "Invalid phone");
    return true;
  });
});

test("missing sessions stop before any profile or verification network request", async () => {
  const api = accountApi({ session: false, fetch: () => { throw new Error("Unexpected network request"); } });
  await assert.rejects(api.fetchAccountProfile(), /sign in again/);
  await assert.rejects(api.fetchVerificationStatus(), /sign in again/);
});

test("host agreement sends explicit acceptance without a client-controlled tier", async () => {
  const api = accountApi({ fetch: async (url, init) => {
    assert.ok(url.endsWith("/api/profile/host"));
    assert.deepEqual(JSON.parse(init.body), { agree: true });
    return response({ ok: true, message: "You are now a verified host." });
  } });
  await api.acceptHostAgreement(true);
});

test("ID picker preserves the whole image and validates type and size before uploading", async () => {
  let asset = { uri: image.uri, mimeType: "image/png", base64: image.base64, fileSize: 3 };
  const { chooseAccountImage } = loadAccountModule("../src/lib/account-image.ts", {
    "expo-image-picker": { launchImageLibraryAsync: async (options) => {
      assert.equal(options.allowsEditing, false);
      assert.equal(options.exif, false);
      return { canceled: false, assets: [asset] };
    } },
  });
  assert.equal((await chooseAccountImage(5)).uri, image.uri);
  asset = { ...asset, mimeType: "image/heic" };
  await assert.rejects(chooseAccountImage(5), /JPEG, PNG or WebP/);
  asset = { ...asset, mimeType: "image/png", fileSize: 6 * 1024 * 1024 };
  await assert.rejects(chooseAccountImage(5), /up to 5 MB/);
});

test("profile photos are resized and uploaded from the prepared file", async () => {
  const original = {
    uri: "file:///temporary/camera.heic",
    mimeType: "image/heic",
    width: 3000,
    height: 4000,
    fileSize: 4 * 1024 * 1024,
  };
  const prepared = { uri: "file:///temporary/avatar.jpg", base64: "AQID" };
  const { chooseProfilePhoto } = loadAccountModule("../src/lib/profile-photo.ts", {
    expo: { requireOptionalNativeModule: (name) => {
      assert.equal(name, "ExpoImageManipulator");
      return {};
    } },
    "react-native": { Platform: { OS: "android" } },
    "@/lib/account-image": { chooseAccountImage: () => assert.fail("Unexpected fallback") },
    "expo-image-picker": {
      UIImagePickerPreferredAssetRepresentationMode: { Compatible: "compatible" },
      launchImageLibraryAsync: async (options) => {
        assert.deepEqual(options.mediaTypes, ["images"]);
        assert.equal(options.preferredAssetRepresentationMode, "compatible");
        return { canceled: false, assets: [original] };
      },
    },
    "expo-image-manipulator": {
      SaveFormat: { JPEG: "jpeg", PNG: "png" },
      ImageManipulator: {
        manipulate(uri) {
          assert.equal(uri, original.uri);
          return {
            resize: (size) => assert.deepEqual(size, { height: 640 }),
            renderAsync: async () => ({
              saveAsync: async (options) => {
                assert.deepEqual(options, { format: "jpeg", compress: 0.8, base64: true });
                return prepared;
              },
            }),
          };
        },
      },
    },
  });

  const avatar = await chooseProfilePhoto();
  assert.deepEqual(avatar, { ...prepared, mimeType: "image/jpeg" });
  const api = accountApi({ fetch: async (_url, init) => {
    const file = init.body.get("avatar");
    assert.ok(file instanceof NativeFile);
    assert.equal(file.uri, prepared.uri);
    assert.deepEqual(await file.bytes(), new Uint8Array([1, 2, 3]));
    return response({ ok: true, message: "Changes saved." });
  } });
  await api.updateAccountProfile({ name: "Name", phone: "", hostName: "", avatar });
});

test("older phone builds can pick an uploadable profile photo without the native resizer", async () => {
  let asset = { ...image, fileSize: 3 };
  const picker = {
    launchImageLibraryAsync: async () => ({ canceled: false, assets: [asset] }),
  };
  const fallback = loadAccountModule("../src/lib/account-image.ts", {
    "expo-image-picker": picker,
  });
  const { chooseProfilePhoto } = loadAccountModule("../src/lib/profile-photo.ts", {
    expo: { requireOptionalNativeModule: () => null },
    "react-native": { Platform: { OS: "android" } },
    "@/lib/account-image": fallback,
    "expo-image-picker": picker,
    get "expo-image-manipulator"() {
      throw new Error("Cannot find native module 'ExpoImageManipulator'");
    },
  });

  assert.equal((await chooseProfilePhoto()).uri, image.uri);
  asset = { ...asset, fileSize: 3 * 1024 * 1024 };
  await assert.rejects(chooseProfilePhoto(), /up to 2 MB/);
});
