import { test, expect } from '@playwright/test'

// 每次运行用唯一邮箱,避免在可能复用的浏览器环境下触发「邮箱已注册」
const email = `e2e-${Date.now()}@test.com`

test('完整流程:注册 → 新建项目 → 构建 → 上线', async ({ page }) => {
  // 1. 首页加载
  await page.goto('./')
  await expect(page.locator('.lhero')).toContainText('把你的想法')

  // 2. 注册
  await page.getByRole('link', { name: '开始使用' }).click()
  await expect(page.getByText('创建你的账户')).toBeVisible()
  await page.getByPlaceholder('你的名字').fill('E2E 测试员')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('至少 6 位').fill('123456')
  await page.getByRole('button', { name: '注册并开始' }).click()

  // 3. 进入工作台
  await expect(page.getByText('我的工作台')).toBeVisible({ timeout: 20_000 })

  // 4. 新建项目
  await page.getByRole('button', { name: /新建项目/ }).click()
  await expect(page.locator('.ob-input')).toBeVisible()

  // 5. 输入想法 → 开始构建
  await page.locator('.ob-input').fill('帮我做一个待办清单应用')
  await page.getByRole('button', { name: /开始构建/ }).click()

  // 6. 等待构建完成并上线(模板引擎约 18s)
  await expect(page.locator('.studio-status.ready')).toContainText('已上线', { timeout: 60_000 })

  // 7. 团队活动流已产生协作记录
  await expect(page.locator('.activity-feed .act-item').first()).toBeVisible()

  // 8. 预览 iframe 已生成(默认「预览」页)
  await expect(page.locator('.iframe-wrap iframe')).toHaveCount(1)

  // 9. 代码视图含 5 个文件
  await page.locator('.pane-tab', { hasText: '代码' }).click()
  await expect(page.locator('.code-view .ft-file')).toHaveCount(5)

  // 10. 发布视图显示成功
  await page.locator('.pane-tab', { hasText: '发布' }).click()
  await expect(page.getByText('发布成功!')).toBeVisible()

  // 11. 分享链接可独立访问:打开后能渲染出应用(而非 404 或空页)
  const shareHref = await page.locator('.pv-open').getAttribute('href')
  expect(shareHref).toBeTruthy()
  await page.goto(shareHref as string)
  await expect(page.locator('.share-view iframe')).toBeVisible()
  const srcdoc = (await page.locator('.share-view iframe').getAttribute('srcdoc')) ?? ''
  expect(srcdoc.length).toBeGreaterThan(200)
})