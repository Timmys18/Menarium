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
  const userA = await createTestUser('swap-a@example.com', 'passwordA123');
  const userB = await createTestUser('swap-b@example.com', 'passwordB123');
  console.log('User A id:', userA.id);
  console.log('User B id:', userB.id);

  console.log('\n== Логин пользователей ==');
  const cookieA = await loginWithCredentials('swap-a@example.com', 'passwordA123');
  const cookieB = await loginWithCredentials('swap-b@example.com', 'passwordB123');

  console.log('\n== Создание объявлений A и B со статусом ACTIVE ==');
  const itemA = await prisma.item.create({
    data: {
      title: 'Swap A',
      type: 'THING',
      category: 'OTHER',
      description: 'Тестовый предмет A',
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
      title: 'Swap B',
      type: 'THING',
      category: 'OTHER',
      description: 'Тестовый предмет B',
      images: '[]',
      city: 'Москва',
      userId: userB.id,
      desiredCategories: '[]',
      acceptsAnything: false,
      additionalItemIds: '[]',
      status: 'ACTIVE',
    },
  });

  console.log('Item A id:', itemA.id, 'status:', itemA.status);
  console.log('Item B id:', itemB.id, 'status:', itemB.status);

  console.log('\n== Создание swap PENDING A -> B через API ==');
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
  console.log('Create swap body:', createSwapBody);

  if (!createSwapRes.ok) {
    console.log('Создать обмен не удалось, прекращаю проверку.');
    return;
  }

  const swapId = createSwapBody.id;

  console.log('\n== Статусы после создания (ожидается PENDING, оба ACTIVE) ==');
  const swapAfterCreate = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    include: { senderItem: true, receiverItem: true },
  });
  console.log('Swap status:', swapAfterCreate.status);
  console.log('Sender item status:', swapAfterCreate.senderItem.status);
  console.log('Receiver item status:', swapAfterCreate.receiverItem.status);

  console.log('\n== Принятие swap владельцем целевого объявления (B) ==');
  const acceptRes = await fetch(`${BASE_URL}/api/exchange`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieB,
    },
    body: JSON.stringify({
      swapId,
      status: 'ACCEPTED',
    }),
  });
  const acceptBody = await acceptRes.json();
  console.log('Accept status:', acceptRes.status);
  console.log('Accept body:', acceptBody);

  const swapAfterAccept = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    include: { senderItem: true, receiverItem: true },
  });
  console.log('After ACCEPTED -> swap:', swapAfterAccept.status);
  console.log('Sender item status:', swapAfterAccept.senderItem.status);
  console.log('Receiver item status:', swapAfterAccept.receiverItem.status);

  console.log('\n== Завершение swap (COMPLETED) владельцем целевого объявления (B) ==');
  const completeRes = await fetch(`${BASE_URL}/api/exchange`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieB,
    },
    body: JSON.stringify({
      swapId,
      status: 'COMPLETED',
    }),
  });
  const completeBody = await completeRes.json();
  console.log('Complete status:', completeRes.status);
  console.log('Complete body:', completeBody);

  const swapAfterComplete = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    include: { senderItem: true, receiverItem: true },
  });
  console.log('After COMPLETED -> swap:', swapAfterComplete.status);
  console.log('Sender item status:', swapAfterComplete.senderItem.status);
  console.log('Receiver item status:', swapAfterComplete.receiverItem.status);

  console.log('\n== Проверка, что ARCHIVED-объявления не попадают в /api/items ==');
  const itemsRes = await fetch(`${BASE_URL}/api/items`);
  const itemsJson = await itemsRes.json();
  console.log('GET /api/items status:', itemsRes.status);
  console.log('Items from API:', itemsJson);
}

run()
  .catch((err) => {
    console.error('Swap e2e failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

