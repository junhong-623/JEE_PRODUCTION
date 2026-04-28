import fs from 'fs'
import path from 'path'

const projectDir = path.resolve(process.cwd(), 'project')
const outputFile = path.resolve(process.cwd(), 'src', 'data', 'projectFolders.json')

if (!fs.existsSync(projectDir)) {
  console.error('错误：project 文件夹不存在。请创建 project 文件夹后再运行。')
  process.exit(1)
}

const items = fs.readdirSync(projectDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map((dirent, index) => ({
    id: dirent.name,
    name: dirent.name,
    description: '',
    url: `/project/${dirent.name}`,
    visible: true,
    order: index + 1,
    iconUrl: null
  }))

fs.mkdirSync(path.dirname(outputFile), { recursive: true })
fs.writeFileSync(outputFile, JSON.stringify(items, null, 2) + '\n', 'utf8')

console.log(`已生成 ${outputFile}，共 ${items.length} 个项目目录。`)
