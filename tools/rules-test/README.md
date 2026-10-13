# Kiểm thử luật Firestore (chạy trên trình giả lập, không đụng dữ liệu thật)

Cần Node.js và Java. Chạy từ một thư mục tạm có cài `firebase-tools`, `@firebase/rules-unit-testing` và `firebase`:

```
mkdir /tmp/rt && cd /tmp/rt && npm init -y && npm i firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10
cp <repo>/firestore.rules . && cp <repo>/tools/rules-test/runner-rules.test.mjs test.mjs
echo '{ "firestore": { "rules": "firestore.rules" }, "emulators": { "firestore": { "port": 8089 }, "ui": { "enabled": false } } }' > firebase.json
npx firebase emulators:exec --only firestore --project demo-hmt "node test.mjs"
```
