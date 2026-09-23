import { test, expect, type Page } from '@playwright/test'

// 每个用例用唯一邮箱,避免在可能复用的浏览器环境下触发「邮箱已注册」
function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`
}

async function signUp(page: Page, name = 'E2E 测试员') {
  await page.goto('./')
  await expect(page.locator('.lhero')).toContainText('把你的想法')
  await page.getByRole('link', { name: '开始使用' }).click()
  await expect(page.getByText('创建你的账户')).toBeVisible()
  await page.getByPlaceholder('你的名字').fill(name)
  await page.getByPlaceholder('you@example.com').fill(uniqueEmail('e2e'))
  await page.getByPlaceholder('至少 6 位').fill('123456')
  await page.getByRole('button', { name: '注册并开始' }).click()
  await expect(page.getByText('我的工作台')).toBeVisible({ timeout: 20_000 })
}

async function newProject(page: Page, idea: string) {
  await page.getByRole('button', { name: /新建项目/ }).click()
  await expect(page.locator('.ob-input')).toBeVisible()
  await page.locator('.ob-input').fill(idea)
  await page.getByRole('button', { name: /开始构建/ }).click()
}

test('完整流程:注册 → 新建项目 → 构建 → 上线', async ({ page }) => {
  await signUp(page)
  await newProject(page, '帮我做一个待办清单应用')

  // 等待构建完成并上线(模板引擎约 18s)
  await expect(page.locator('.studio-status.ready')).toContainText('已上线', { timeout: 60_000 })

  // 团队活动流已产生协作记录
  await expect(page.locator('.activity-feed .act-item').first()).toBeVisible()

  // 预览 iframe 已生成(默认「预览」页)
  await expect(page.locator('.iframe-wrap iframe')).toHaveCount(1)

  // 代码视图含 5 个文件
  await page.locator('.pane-tab', { hasText: '代码' }).click()
  await expect(page.locator('.code-view .ft-file')).toHaveCount(5)

  // 发布视图显示成功
  await page.locator('.pane-tab', { hasText: '发布' }).click()
  await expect(page.getByText('发布成功!')).toBeVisible()

  // 分享链接可独立访问:打开后能渲染出应用(而非 404 或空页)
  const shareHref = await page.locator('.pv-open').getAttribute('href')
  expect(shareHref).toBeTruthy()
  await page.goto(shareHref as string)
  await expect(page.locator('.share-view iframe')).toBeVisible()
  const srcdoc = (await page.locator('.share-view iframe').getAttribute('srcdoc')) ?? ''
  expect(srcdoc.length).toBeGreaterThan(200)
})

test('未匹配模板的想法给出明确引导,而非静默生成空壳', async ({ page }) => {
  await signUp(page, '提示测试')

  await page.getByRole('button', { name: /新建项目/ }).click()
  await expect(page.locator('.ob-input')).toBeVisible()
  // 刻意避开所有内置模板关键词
  await page.locator('.ob-input').fill('帮我做一个字幕翻译工具')
  await expect(page.locator('.ob-warn')).toBeVisible()
  await expect(page.locator('.ob-warn')).toContainText('未匹配到内置模板')

  await page.getByRole('button', { name: /开始构建/ }).click()
  await expect(page.locator('.studio-status.ready')).toContainText('已上线', { timeout: 60_000 })

  // 构建活动流里也应出现 warning 提示(系统事件)
  await expect(page.locator('.activity-feed')).toContainText('未匹配到内置模板')
})

test('番茄钟想法命中专用模板且计时可用', async ({ page }) => {
  await signUp(page, '番茄测试')
  await newProject(page, '帮我做一个番茄钟')

  await expect(page.locator('.studio-status.ready')).toContainText('已上线', { timeout: 60_000 })

  const frame = page.frameLocator('.iframe-wrap iframe')
  // 命中番茄钟模板(标题),而不是「全新应用」通用占位
  await expect(frame.locator('h1')).toHaveText('番茄钟')
  // 计时盘初始 25:00
  await expect(frame.locator('#time')).toHaveText('25:00')
  // 点「开始」→ 变「暂停」,且秒数真的在走
  await frame.locator('#start').click()
  await expect(frame.locator('#start')).toHaveText('暂停')
  await page.waitForTimeout(2100)
  await expect(frame.locator('#time')).not.toHaveText('25:00')
})