/* Security hardening integration tests for Menarium.
 * Creates two users, one item, and exercises protected API endpoints via real HTTP calls.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';

async function createTestUser(email, password) {
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed },
    create: {
      email,
      password: hashed,
    },
  });
  return user;
}

async function loginWithCredentials(email, password) {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfJson = await csrfRes.json();
  const csrfToken = csrfJson.csrfToken;
  const csrfCookie = csrfRes.headers.get('set-cookie') || '';

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: '/',
    json: 'true',
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials?callbackUrl=%2F`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfCookie,
    },
    redirect: 'manual',
    body,
  });

  const setCookie = loginRes.headers.get('set-cookie') || '';
  const cookies = setCookie.split(',');
  const sessionCookie =
    cookies.find((c) => c.includes('next-auth.session-token')) ||
    cookies.find((c) => c.includes('next-auth.session-id')) ||
    cookies[0];

  if (!sessionCookie) {
    throw new Error('Не удалось получить cookie сессии');
  }

  const sessionCookieHeader = sessionCookie.split(';')[0];
  return sessionCookieHeader;
}

async function run() {
  console.log('== Создание тестовых пользователей ==');
  const userA = await createTestUser('test-a@example.com', 'passwordA123');
  const userB = await createTestUser('test-b@example.com', 'passwordB123');
  console.log('User A id:', userA.id);
  console.log('User B id:', userB.id);

  console.log('\n== Логин пользователей через NextAuth (credentials) ==');
  const cookieA = await loginWithCredentials('test-a@example.com', 'passwordA123');
  const cookieB = await loginWithCredentials('test-b@example.com', 'passwordB123');
  console.log('Cookie A:', cookieA);
  console.log('Cookie B:', cookieB);

  console.log('\n== Создание объявлений для пользователей A и B через Prisma ==');
  const itemA = await prisma.item.create({
    data: {
      title: 'Тестовый предмет A',
      type: 'THING',
      category: 'OTHER',
      description: 'Объявление пользователя A',
      images: '[]',
      city: 'Москва',
      userId: userA.id,
      desiredCategories: '[]',
      acceptsAnything: false,
      additionalItemIds: '[]',
      status: 'ACTIVE',
    },
  });

  const itemB = await prisma.item.create({
    data: {
      title: 'Тестовый предмет B',
      type: 'THING',
      category: 'OTHER',
      description: 'Объявление пользователя B',
      images: '[]',
      city: 'Москва',
      userId: userB.id,
      desiredCategories: '[]',
      acceptsAnything: false,
      additionalItemIds: '[]',
      status: 'ACTIVE',
    },
  });

  console.log('Item A id:', itemA.id);
  console.log('Item B id:', itemB.id);

  console.log('\n== Тест 1: Попытка удалить объявление A от пользователя B (ожидается 403) ==');
  const deleteRes = await fetch(`${BASE_URL}/api/items/${itemA.id}`, {
    method: 'DELETE',
    headers: {
      Cookie: cookieB,
    },
  });
  const deleteText = await deleteRes.text();
  console.log('DELETE status:', deleteRes.status);
  console.log('DELETE body:', deleteText);

  console.log('\n== Тест 2: Попытка создать swap к самому себе (ожидается 400) ==');
  const selfSwapRes = await fetch(`${BASE_URL}/api/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieA,
    },
    body: JSON.stringify({
      senderItemId: itemA.id,
      receiverItemId: itemA.id,
    }),
  });
  const selfSwapText = await selfSwapRes.text();
  console.log('Self-swap status:', selfSwapRes.status);
  console.log('Self-swap body:', selfSwapText);

  console.log('\n== Тест 3: Создание swap A -> B, принятие не владельцем (ожидается 403) ==');
  const createSwapRes = await fetch(`${BASE_URL}/api/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieA,
    },
    body: JSON.stringify({
      senderItemId: itemA.id,
      receiverItemId: itemB.id,
    }),
  });
  const createSwapBody = await createSwapRes.json();
  console.log('Create swap status:', createSwapRes.status);
  console.log('Create swap body:', JSON.stringify(createSwapBody));

  if (!createSwapRes.ok) {
    console.log('Создать обмен не удалось, дальнейшие проверки невозможны.');
    return;
  }

  const swapId = createSwapBody.id;

  const wrongAcceptRes = await fetch(`${BASE_URL}/api/exchange`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieA,
    },
    body: JSON.stringify({
      swapId,
      status: 'ACCEPTED',
    }),
  });
  const wrongAcceptText = await wrongAcceptRes.text();
  console.log('Wrong accept status:', wrongAcceptRes.status);
  console.log('Wrong accept body:', wrongAcceptText);
}

run()
  .catch((err) => {
    console.error('Security tests failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

