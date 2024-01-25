import Path from 'path';
import Fs from 'fs';
import fs from 'fs';
import Assert from 'assert';
import Semver from 'semver';
import {IApi} from '@umijs/types';
import HTMLWebpackPlugin from 'html-webpack-plugin';


interface isConfig {
    splitChunks: boolean;
    rootPath: string;
    mainFileName: string;
    configFileName: string;
    encoding: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
    distPathBefore: string;
    contentScriptsPathName: string;
    backgroundPathName: string;
    optionsPathName: string;
    popupPathName: string;
    support360: boolean;
    clearAbsPath: boolean | string;
}

const DefaultConfig: isConfig = {
    splitChunks: true,
    rootPath: Path.posix.join('src', 'extension'),
    mainFileName: 'index.[jt]s{,x}',
    configFileName: 'index.json',
    encoding: 'utf-8',
    distPathBefore: '',
    contentScriptsPathName: "content_scripts",
    backgroundPathName: "background",
    optionsPathName: "options",
    popupPathName: "popup",
    support360: false,
    clearAbsPath: true,
};


export default function (api: IApi) {
    if (api.hasPlugins(['chromiumExtension'])) {
        // 阻止重复加载,为什么会重复加载原因未知,反正本地link组件后就出现这个问题
        return;
    }
    const {logger, utils: {glob}} = api;
    const {UMI_VERSION: umiVersion, NODE_ENV} = process.env;
    Assert(
        Semver.gte(umiVersion, '3.0.0') && Semver.lt(umiVersion, '4.0.0'),
        `Your umi version is ${umiVersion}, >=3.0.0 and <4 is required.`,
    );

    api.describe({
        id: 'chromiumExtension',
        key: 'chromiumExtension',
        config: {
            default: DefaultConfig,
            schema(joi) {
                return joi.object({
                    splitChunks: joi.boolean(),
                    rootPath: joi.string(),
                    mainFileName: joi.string(),
                    configFileName: joi.string(),
                    encoding: joi.string(),
                    distPathBefore: joi.string().allow('').allow(null),
                    contentScriptsPathName: joi.string(),
                    backgroundPathName: joi.string(),
                    optionsPathName: joi.string(),
                    popupPathName: joi.string(),
                    support360: joi.boolean().default(false),
                    // clearAbsPath:  boolean 和 string 二选一 ,默认为 true
                    clearAbsPath: joi.alternatives([joi.boolean(), joi.string()]).default(true),
                });
            },
        }
    });

    const pluginConfig = initPluginConfig();
    const {rootPath, mainFileName, backgroundPathName, optionsPathName, popupPathName, contentScriptsPathName, configFileName, encoding, distPathBefore, splitChunks, support360, clearAbsPath} = pluginConfig;

    const contentScriptsPath = Path.posix.join(rootPath, contentScriptsPathName);
    const backgroundPath = Path.posix.join(rootPath, backgroundPathName);
    const optionsPath = Path.posix.join(rootPath, optionsPathName);
    const popupPath = Path.posix.join(rootPath, popupPathName);
    const vendorDllPath = Path.posix.join(distPathBefore, Path.posix.join('dll', 'vendor'));
    const userWebpackConfigMap = {entry: {}, html: {}};
    let outputPath: string;
    let mainFileGroup: string[];
    let manifestJson: { [k: string]: any };
    let extensionName: string;


    // 不生成html文件
    process.env.HTML = 'none';
    // 默认关闭热更新, 实测无效,hot-update文件依然在生成
    process.env.HMR = 'none'
    // 不要添加路由中间件
    process.env.ROUTE_MIDDLEWARE = 'none';

    const isDev = NODE_ENV === 'development';

    // 启动时初始化Manifest清单文件
    api.onPluginReady(() => {
        // 读取全部入口文件
        mainFileGroup = findFileGroup(rootPath, mainFileName);
        // 生成manifestJson, 并初始化入口与HTML
        manifestJson = initManifestJson();
        extensionName = manifestJson.name;
    });

    // 修改默认配置, 重定向编译位置分为dev和build两个目录, devServer开启写入文件, 提供一个空的routes配置，这样就不会走约定式路由
    api.modifyDefaultConfig(memo => {
        // 重定向编译位置
        if (memo.outputPath) {
            outputPath = memo.outputPath;
            const devServer = memo.devServer || {};
            outputPath = Path.posix.join(outputPath, isDev ? 'dev' : 'build');
            devServer.writeToDisk = true;
            // 清理历史生成的文件
            removeFileOrDirSync(outputPath);
            if (!isDev && support360) {
                outputPath = Path.posix.join(outputPath, 'chrome');
            }
            return {
                ...memo,
                routes: [],
                outputPath,
                devServer,
            };
        }
        return memo;
    });

    // Build完成后写入清单文件
    api.onBuildComplete(({stats, err}) => {
        if (err) return;
        writeManifestJson(manifestJson, outputPath);
        if (clearAbsPath) {
            const {absOutputPath} = api.paths;
            if (stats && absOutputPath) {
                for (const stat of stats.stats) {
                    for (const chunk of stat.compilation.chunks) {
                        for (const file of chunk.files) {
                            if (/.*\.jsx*$/.test(file)) {
                                clearAbsPathName(Path.join(absOutputPath, file));
                            }
                        }
                    }
                }
            }
        }
        if (support360) {
            // 需要把chrome的编译结果复制到360
            copyFilesSync(outputPath, Path.posix.join(outputPath, '..', '360'), ['manifest.json']);
        }
    });

    // 首次Dev编译成功后写入清单文件
    api.onDevCompileDone(({isFirstCompile}) => {
        if (isFirstCompile) {
            writeManifestJson(manifestJson, outputPath);
        }
    });


    api.modifyBundleConfig(webpackConfig => {
        const {entry, html} = userWebpackConfigMap;

        webpackConfig.entry = entry;
        Object.keys(html).forEach(htmlDistName => {
            const htmlPath = html[htmlDistName];
            let isSrc = htmlPath.indexOf('.ejs') !== -1;
            const config: any = {
                filename: `${htmlDistName}.html`,
                chunks: splitChunks ? [vendorDllPath, htmlDistName] : [htmlDistName],
                minify: true,
            };
            if (isSrc) {
                config.template = require.resolve(Path.resolve(htmlPath));
            } else {
                config.title = extensionName || "Chromium Extension Page";
            }
            // @ts-ignore
            webpackConfig.plugins.push(new HTMLWebpackPlugin(config));
        });
        if (splitChunks) {
            webpackConfig.optimization = {
                ...(webpackConfig.optimization || {}),
                splitChunks: {
                    cacheGroups: {
                        vendor: {
                            chunks: "all",
                            test: /\.[j|t]sx*$/,
                            name: vendorDllPath,
                            minChunks: 2,
                            priority: 1,
                        },
                    },
                    ...(typeof splitChunks === "object" ? splitChunks : {}),
                }
            }
        }
        return webpackConfig;
    });

    function clearAbsPathName(path: string) {
        const fileText = fs.readFileSync(path, 'utf-8');
        const end = fileText.indexOf("_node_modules_umijs_babel_preset_");
        let start = end;
        if (start > 0) {
            while (start--) {
                if (fileText[start] === " ") {
                    break;
                }
            }
            if (start > 0) {
                const pathName = fileText.slice(start, end).trim();
                if (pathName) {
                    const outText = fileText.replace(new RegExp(pathName, 'g'), typeof clearAbsPath === "boolean" ? "__ROOT__" : clearAbsPath);
                    fs.writeFileSync(path, outText, 'utf-8');
                }
            }
        }
    }

    // 新版本中已经不存在热更新文件了
    // api.onDevCompileDone(() => {
    //     // 检测热更新文件,并清除热更新文件,在UmiJs官方还未屏蔽dev写入硬盘模式生成hot-update文件时,只能先这么做了
    //     const hotUpdateFileGroup = findFileGroup(outputPath, '*.hot-update.*');
    //     hotUpdateFileGroup.forEach(removeFileOrDirSync);
    //     logger.log(`[umi3-plugin-chromium-extension] ${hotUpdateFileGroup.length} hot-update files cleaned.`);
    // });

    function initPluginConfig(): isConfig {
        return {
            ...DefaultConfig,
            ...(api.userConfig.chromiumExtension || {}),
        };
    }

    function initManifestJson() {
        const manifestPath = Path.posix.join(rootPath, 'manifest.json');
        const manifestDevPath = Path.posix.join(rootPath, 'manifest.dev.json');
        if (!Fs.existsSync(manifestPath)) {
            logger.error(`[umi3-plugin-chromium-extension]  manifest file no found:\t${manifestPath}`);
            throw Error();
        }
        let config = JSON.parse(Fs.readFileSync(manifestPath, {encoding}).toString());
        let devConfig = {};
        if (Fs.existsSync(manifestDevPath)) {
            devConfig = JSON.parse(Fs.readFileSync(manifestDevPath, {encoding}).toString());
        }

        config.content_scripts = [];


        // 获取页面脚本所有定义文件
        if (mainFileGroup.length > 0) {
            mainFileGroup.forEach(filePath => {
                const filePathDistKey = getFilePathDistKey(filePath);
                if (filePath.indexOf(contentScriptsPath) === 0) {
                    initManifestContentScriptsItemConfig(config, filePath);
                } else {
                    // 寻找对应的ejs文件
                    let findHtml = false;
                    const templateFile = Path.posix.join(Path.dirname(filePath), `${Path.basename(filePath, Path.extname(filePath))}.ejs`);
                    if (Fs.existsSync(templateFile)) {
                        findHtml = true;
                        userWebpackConfigMap.html[filePathDistKey] = `./${templateFile}`;
                    }
                    if (!findHtml) {
                        const templateFile = Path.posix.join(rootPath, `index.ejs`);
                        if (Fs.existsSync(templateFile)) {
                            userWebpackConfigMap.html[filePathDistKey] = `./${templateFile}`;
                        } else {
                            userWebpackConfigMap.html[filePathDistKey] = '';
                        }
                    }
                    if (filePath.indexOf(optionsPath) === 0) {
                        initManifestItemConfig(config, filePath, 'options_ui', {
                            "page": Path.posix.join(distPathBefore, optionsPathName, "index.html"),
                            "open_in_tab": true
                        });
                    } else if (filePath.indexOf(popupPath) === 0) {
                        initManifestItemConfig(config, filePath, 'browser_action', {
                            "default_title": config.name,
                            "default_popup": Path.posix.join(distPathBefore, popupPathName, "index.html"),
                        });
                    } else if (filePath.indexOf(backgroundPath) === 0) {
                        initManifestItemConfig(config, filePath, 'background', {
                            "page": Path.posix.join(distPathBefore, backgroundPathName, "index.html"),
                        });
                    } else {
                        logger.warn(`[umi3-plugin-chromium-extension] ignored unknown entry file:\t${filePath}`);
                    }
                }
                userWebpackConfigMap.entry[filePathDistKey] = `./${filePath}`;
            });
        }
        if (isDev) {
            config = {...config, ...devConfig};
        }
        return config;
    }

    function initManifestItemConfig(config: { [k: string]: any }, mainFilePath: string, configName: string, defaultConfig: { [k: string]: any }) {
        const configPath = Path.posix.join(Path.dirname(mainFilePath), configFileName);
        let userConfig = {};
        if (Fs.existsSync(configPath)) {
            userConfig = JSON.parse(Fs.readFileSync(configPath, {encoding}).toString());
        }
        config[configName] = {
            ...defaultConfig,
            ...(config[configName] || {}),
            ...userConfig,
        }
    }

    function initManifestContentScriptsItemConfig(config: { [k: string]: any }, mainFilePath: string) {
        const configPath = Path.posix.join(Path.dirname(mainFilePath), configFileName);
        if (Fs.existsSync(configPath)) {
            const info = JSON.parse(Fs.readFileSync(configPath, {encoding}).toString());
            const pathBefore = Path.posix.join(distPathBefore, Path.posix.dirname(configPath.replace(`${rootPath}/`, '')));
            delete info.text;
            initFilePath(pathBefore, info.js);
            initFilePath(pathBefore, info.css);
            if (splitChunks) {
                info.js.unshift(`${vendorDllPath}.js`);
            }
            config.content_scripts.push(info);
        } else {
            logger.error(`[umi3-plugin-chromium-extension] content scripts configuration file no found:\t ${configPath}`)
            throw Error();
        }
    }

    function initFilePath(path: string, configList: string[]) {
        if (configList) {
            // TODO 判断文件是否存在,然后再加上路径判断是否存在
            for (let i = 0; i < configList.length; i += 1) {
                const name = configList[i];
                if (name.indexOf(path) === -1) {
                    configList[i] = Path.posix.join(path, name);
                }
            }
        }
    }

    function getFilePathDistKey(path: string) {
        return Path.posix.join(distPathBefore, path.replace(`${rootPath}/`, '').replace(/\.[j|t]sx*$/, ''));
    }

    function findFileGroup(pathBefore: string, fileName: string) {
        return (glob.sync(`${pathBefore}/**/${fileName}`)).map(path => Path.posix.normalize(path));
    }

    function writeFileSync(filePath: string, data: any) {
        const dir = Path.dirname(filePath);
        if (!Fs.existsSync(dir)) {
            Fs.mkdirSync(dir);
        }
        Fs.writeFileSync(filePath, data);
    }

    function copyFilesSync(srcPath: string, destPath: string, blackList: string[]) {
        const files = Fs.readdirSync(srcPath);
        for (let file of files) {
            if (blackList.indexOf(file) === -1) {
                const filePath = Path.posix.join(srcPath, file);
                const targetPath = Path.posix.join(destPath, file);
                const stat = Fs.statSync(filePath);
                if (stat.isDirectory()) {
                    if (!Fs.existsSync(targetPath)) {
                        Fs.mkdirSync(targetPath);
                    }
                    copyFilesSync(filePath, targetPath, blackList);
                } else {
                    Fs.copyFileSync(filePath, targetPath);
                }
            }
        }
    }

    function removeFileOrDirSync(filePath: string) {
        try {
            if (Fs.existsSync(filePath)) {
                const STATUS = Fs.statSync(filePath);
                if (STATUS.isFile()) {
                    // 如果原路径是文件
                    //删除原文件
                    Fs.unlinkSync(filePath);
                } else if (STATUS.isDirectory()) {
                    //如果原路径是目录
                    //如果原路径是非空目录,遍历原路径
                    //空目录时无法使用forEach
                    Fs.readdirSync(filePath).forEach(item => {
                        //递归调用函数，以子文件路径为新参数
                        removeFileOrDirSync(`${filePath}/${item}`);
                    });
                    //删除空文件夹
                    Fs.rmdirSync(filePath);
                }
            }
        } catch (e) {
            console.error(e);
        }

    }

    function writeManifestJson(manifestJson: { [k: string]: any }, outputPath: string) {
        if (isDev || !support360) {
            writeFileSync(Path.posix.join(outputPath, 'manifest.json'), JSON.stringify(manifestJson, null, 2));
        } else {
            writeFileSync(Path.posix.join(outputPath, 'manifest.json'), JSON.stringify(manifestJson, null, 2));
            const manifest360Json = {...manifestJson};
            manifest360Json['update_url'] = "http://upext.chrome.360.cn/intf.php?method=ExtUpdate.query";
            writeFileSync(Path.posix.join(outputPath, '..', '360', 'manifest.json'), JSON.stringify(manifest360Json, null, 2));
        }
    }
};

