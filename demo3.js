/**
 * 自动化测试
 */
const puppeteer = require("puppeteer")
const prompts = require("prompts")
const chalk = require("chalk")

let page

const log = str => console.log(`[LOG]: ${str}`)
const successLog = str => console.log(chalk.green(`[成功]: ${str}`))
const errLog = str => console.log(chalk.red(`[失败]: ${str}`))

/**
 * 测试登录接口正常，且前端登录之后跳转正常
 */
const testCanLoginSuccess = async () => {
  log("测试登录功能是否正常")
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
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click("#__layout > div > div.page-content-view > div > button > div")
  ])
  const homePage = page.url()
  if (homePage.includes("/home")) {
    successLog("登录功能正常")
  } else {
    errLog("登录功能异常")
  }
}

const work = async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 375, height: 667, isMobile: true }, devtools: true })
  page = await browser.newPage()
  await testCanLoginSuccess()
  // await browser.close()
}
work()