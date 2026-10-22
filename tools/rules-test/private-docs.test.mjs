// Kiểm thử luật cho private_docs (danh sách hệ khách lẻ): chỉ quản trị viên đọc/ghi.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
const env = await initializeTestEnvironment({ projectId: 'demo-hmt', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8089 } });
await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'allowed/admin@x.com'), { role: 'admin', active: true, name: 'QT' });
  await setDoc(doc(db, 'allowed/old@x.com'), { role: 'admin', active: false, name: 'QT cũ' });
  await setDoc(doc(db, 'allowed/nv@x.com'), { role: 'member', active: true, name: 'NV' });
});
const ctx = (uid, email) => env.authenticatedContext(uid, { email, email_verified: true }).firestore();
const admin = ctx('a', 'admin@x.com'), locked = ctx('o', 'old@x.com'), member = ctx('m', 'nv@x.com'), other = ctx('x', 'x@gmail.com');
const anon = env.unauthenticatedContext().firestore();
const D = (db) => doc(db, 'private_docs/khach_le');
let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { fail++; console.log('LỖI', name, '->', String(e.message || e).split('\n')[0].slice(0, 140)); } };
await t('quản trị ghi danh sách', () => assertSucceeds(setDoc(D(admin), { rows: [{ name: 'A', phone: '090' }] })));
await t('quản trị đọc danh sách', () => assertSucceeds(getDoc(D(admin))));
await t('nhân viên (member) đọc -> bị chặn', () => assertFails(getDoc(D(member))));
await t('tài khoản Google bất kỳ đọc -> bị chặn', () => assertFails(getDoc(D(other))));
await t('quản trị đã bị khoá đọc -> bị chặn', () => assertFails(getDoc(D(locked))));
await t('chưa đăng nhập đọc -> bị chặn', () => assertFails(getDoc(D(anon))));
await t('nhân viên ghi -> bị chặn', () => assertFails(setDoc(D(member), { rows: [] })));
await t('nhân viên xoá -> bị chặn', () => assertFails(deleteDoc(D(member))));
console.log('\nđạt', pass, ' lỗi', fail);
await env.cleanup(); process.exit(fail ? 1 : 0);
