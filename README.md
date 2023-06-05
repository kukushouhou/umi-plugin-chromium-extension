# umi-plugin-chromium-extension

UmiJs v3 plugin: chromium extension development

这个插件可以让你用UmiJs v3.x.x下开发Chromium扩展，可以自动的扫描出相应目录下的Content_Scripts、Background、Options与Popup的入口文件，并自动生成相应的“manifest.json”文件。

## 使用方法：
安装插件后在`.umirc.ts`或`.umirc.js`文件中的`plugins`选项中加入`umi-plugin-chromium-extension`,然后根节点加入`chromiumExtension`选项自定义配置然后运行即可.

| 配置项 | 类型 | 默认值 | 说明 | 版本 |
| --- | --- | --- | --- | --- |
| splitChunks | boolean | true | 是否自动分割代码 | - |
| rootPath | string | “./src/extension” | `manifest.json`文件以及`content_scripts`、`background`、`options`和`popup`文件夹的所在目录 | - |
| mainFileName | string | “index.[jt]s{,x}” | 插件寻找各个文件夹的主入口时的正则匹配方法 | - |
| configFileName | string | “index.json” | `content_scripts`子目录中各个页面内容脚本的配置文件名(使用本插件后各个内容脚本的配置文件可以不写在`manifest.json`文件中,可以写在每个子目录中,每次启动编译的时候会自动寻找并合并输出到编译目录到`manifest.json`文件中) | - |
| encoding | string | “utf-8” | `manifest.json`文件和`content_scripts`子配置的编码方式 | - |
| distPathBefore | string | "" | 编译后的`content_scripts`、`background`、`options`和`popup`等文件夹构建到输出目录时是否要在包裹一层目录让编译后的输出目录更美观 | - |
| contentScriptsPathName | string | “content_scripts” | 内容脚本目录的目录名 | - |
| backgroundPathName | string | "background" | 后台脚本目录的目录名 | - |
| optionsPathName | string | "options" | 选项页的目录名 | - |
| popupPathName | string | "popup" | 气泡页的目录名 | - |
| support360 | boolean | false | build时是否构建出360浏览器版本的构建,360浏览器版本的构建和Chrome版本的构建的区别就是默认不带`update_url`,360浏览器版本的构建会复制一份Chrome版本的构建到360的目录,然后在`manifest.json`文件中增加`update_url`属性赋值到360的更新服务器 | 0.0.8 |

### 已知问题:
目前dev状态下偶尔会报umi入口不存在而停止运行,主要是因为通过浏览器直接访问了dev服务器的网页导致的,插件开发的过程中不需要访问网页,建议修改dev服务器的配置,将port修改到五位数大端口,将host修改成`127.0.0.1`,以保证不会被意外的访问导致dev服务器停止运行.
