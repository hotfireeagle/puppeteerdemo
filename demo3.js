/**
 * 自动化测试
 */
const puppeteer = require("puppeteer")
const prompts = require("prompts")

let page

const testCanLoginSuccess = async () => {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.goto("https://sit-biz.booleandata.cn/own/?channel=03")
  ])
  // 输入手机号
  await page.type(
    "#__layout > div > div.page-content-view > div > div.formContainer > div > div.row.row1 > div > div > div.md-field-item-control > input",
    "15170306850",
    { delay: 200 }
  )
  await page.click("#__layout > div > div.page-content-view > div > div.formContainer > div > div:nth-child(2) > button > div")
  const inputObj = await prompts({
    type: "text",
    name: "code",
    message: "输入验证码"
  })
  const { code } = inputObj
  // 输入验证码
  await page.type(
    "#__layout > div > div.page-content-view > div > div.formContainer > div > div:nth-child(2) > div > div > div > input",
    code,
    { delay: 200 }
  )
  // 点击登录
  await page.click("#__layout > div > div.page-content-view > div > button > div")
}

const work = async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 375, height: 667, isMobile: true }, devtools: true })
  page = await browser.newPage()
  await testCanLoginSuccess()
  // await browser.close()
}
work()