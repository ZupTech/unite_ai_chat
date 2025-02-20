import { test, expect, Route, Page } from '@playwright/test';

test('auth init redirects to auth URL', async ({ page }: { page: Page }) => {
  // Interceptar a chamada para oauth-init e verificar se o redirect_uri é apenas o domínio
  await page.route('**/api/oauth-init**', async (route: Route) => {
    const url = new URL(route.request().url());
    const redirect_uri = url.searchParams.get('redirect_uri');
    expect(redirect_uri).toBe('http://localhost:3000');
    
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        authUrl: 'https://auth.myunite.ai/authorize?response_type=code&client_id=test'
      })
    });
  });

  await page.goto('http://localhost:3000/');
  
  // Verificar se o log foi registrado
  const consoleMessages: string[] = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  
  // Verificar se foi redirecionado para a URL de auth
  await expect(page).toHaveURL(/^https:\/\/auth\.myunite\.ai\/authorize/);
});

test('oauth callback flow', async ({ page }) => {
  // Mock das respostas da API
  await page.route('/api/oauth-callback*', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        token: 'test-xano-token'
      })
    });
  });

  await page.route('/api/auth/xano', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token'
        }
      })
    });
  });

  // Simular chegada com código de auth
  await page.goto('http://localhost:3000/?code=test-auth-code');

  // Verificar se o token foi salvo no localStorage
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  expect(token).toBe('test-xano-token');
});

test('workspace initialization after auth', async ({ page }) => {
  // Mock das respostas necessárias
  await page.route('**/api/auth/xano', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          user: { id: 'test-user-id' }
        }
      })
    });
  });

  await page.route('**/rest/v1/profiles*', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'test-profile-id',
        user_id: 'test-user-id',
        has_onboarded: true
      })
    });
  });

  await page.route('**/rest/v1/workspaces*', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        {
          id: 'test-workspace-id',
          user_id: 'test-user-id',
          is_home: true
        }
      ])
    });
  });

  // Iniciar com token no localStorage
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'test-xano-token');
  });

  await page.goto('http://localhost:3000/');

  // Verificar se foi redirecionado para o workspace
  await expect(page).toHaveURL(/\/test-workspace-id\/chat$/);
});

test('handles auth errors appropriately', async ({ page }) => {
  // Mock de erro na API
  await page.route('/api/oauth-init', async route => {
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Auth initialization failed' })
    });
  });

  await page.goto('http://localhost:3000/');

  // Verificar se o erro foi logado
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  expect(consoleErrors.some(error => error.includes('Error during auth init'))).toBeTruthy();
});

//more tests can be added here