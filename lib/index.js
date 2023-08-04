"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function _path() {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function _fs() {
    return data;
  };
  return data;
}
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function _assert() {
    return data;
  };
  return data;
}
function _semver() {
  const data = _interopRequireDefault(require("semver"));
  _semver = function _semver() {
    return data;
  };
  return data;
}
function _htmlWebpackPlugin() {
  const data = _interopRequireDefault(require("html-webpack-plugin"));
  _htmlWebpackPlugin = function _htmlWebpackPlugin() {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const DefaultConfig = {
  splitChunks: true,
  rootPath: _path().default.posix.join('src', 'extension'),
  mainFileName: 'index.[jt]s{,x}',
  configFileName: 'index.json',
  encoding: 'utf-8',
  distPathBefore: '',
  contentScriptsPathName: "content_scripts",
  backgroundPathName: "background",
  optionsPathName: "options",
  popupPathName: "popup",
  support360: false,
  clearAbsPath: true
};
function _default(api) {
  if (api.hasPlugins(['chromiumExtension'])) {
    // 阻止重复加载,为什么会重复加载原因未知,反正本地link组件后就出现这个问题
    return;
  }
  const logger = api.logger,
    glob = api.utils.glob;
  const umiVersion = process.env.UMI_VERSION;
  (0, _assert().default)(_semver().default.gte(umiVersion, '3.0.0') && _semver().default.lt(umiVersion, '4.0.0'), `Your umi version is ${umiVersion}, >=3.0.0 and <4 is required.`);
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
          clearAbsPath: joi.boolean().default(true)
        });
      }
    }
  });
  const pluginConfig = initPluginConfig();
  const rootPath = pluginConfig.rootPath,
    mainFileName = pluginConfig.mainFileName,
    backgroundPathName = pluginConfig.backgroundPathName,
    optionsPathName = pluginConfig.optionsPathName,
    popupPathName = pluginConfig.popupPathName,
    contentScriptsPathName = pluginConfig.contentScriptsPathName,
    configFileName = pluginConfig.configFileName,
    encoding = pluginConfig.encoding,
    distPathBefore = pluginConfig.distPathBefore,
    splitChunks = pluginConfig.splitChunks,
    support360 = pluginConfig.support360,
    clearAbsPath = pluginConfig.clearAbsPath;
  const contentScriptsPath = _path().default.posix.join(rootPath, contentScriptsPathName);
  const backgroundPath = _path().default.posix.join(rootPath, backgroundPathName);
  const optionsPath = _path().default.posix.join(rootPath, optionsPathName);
  const popupPath = _path().default.posix.join(rootPath, popupPathName);
  const vendorDllPath = _path().default.posix.join(distPathBefore, _path().default.posix.join('dll', 'vendor'));
  const userWebpackConfigMap = {
    entry: {},
    html: {}
  };
  let outputPath;
  let mainFileGroup;
  let manifestJson;
  let extensionName;

  // 不生成html文件
  process.env.HTML = 'none';
  // 默认关闭热更新, 实测无效,hot-update文件依然在生成
  process.env.HMR = 'none';
  // 不要添加路由中间件
  process.env.ROUTE_MIDDLEWARE = 'none';
  const isDev = process.env.NODE_ENV === 'development';

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
    outputPath = memo.outputPath;
    const devServer = memo.devServer || {};
    outputPath = _path().default.posix.join(outputPath, isDev ? 'dev' : 'build');
    // 写入到文件,研究了半天居然有现成的方法!!!
    devServer.writeToDisk = true;
    // 清理历史生成的文件
    removeFileOrDirSync(outputPath);
    if (!isDev && support360) {
      outputPath = _path().default.posix.join(outputPath, 'chrome');
    }
    return _objectSpread(_objectSpread({}, memo), {}, {
      routes: [],
      outputPath,
      devServer
    });
  });

  // Build完成后写入清单文件
  api.onBuildComplete(({
    stats,
    err
  }) => {
    if (err) return;
    writeManifestJson(manifestJson, outputPath);
    if (clearAbsPath) {
      const absOutputPath = api.paths.absOutputPath;
      if (stats && absOutputPath) {
        var _iterator = _createForOfIteratorHelper(stats.stats),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            const stat = _step.value;
            var _iterator2 = _createForOfIteratorHelper(stat.compilation.chunks),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                const chunk = _step2.value;
                var _iterator3 = _createForOfIteratorHelper(chunk.files),
                  _step3;
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    const file = _step3.value;
                    if (/.*\.jsx*$/.test(file)) {
                      clearAbsPathName(_path().default.join(absOutputPath, file));
                    }
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }
    if (support360) {
      // 需要把chrome的编译结果复制到360
      copyFilesSync(outputPath, _path().default.posix.join(outputPath, '..', '360'), ['manifest.json']);
    }
  });

  // 首次Dev编译成功后写入清单文件
  api.onDevCompileDone(({
    isFirstCompile
  }) => {
    if (isFirstCompile) {
      writeManifestJson(manifestJson, outputPath);
    }
  });
  api.modifyBundleConfig(webpackConfig => {
    const entry = userWebpackConfigMap.entry,
      html = userWebpackConfigMap.html;
    webpackConfig.entry = entry;
    Object.keys(html).forEach(htmlDistName => {
      const htmlPath = html[htmlDistName];
      let isSrc = htmlPath.indexOf('.ejs') !== -1;
      const config = {
        filename: `${htmlDistName}.html`,
        chunks: splitChunks ? [vendorDllPath, htmlDistName] : [htmlDistName],
        minify: true
      };
      if (isSrc) {
        config.template = require.resolve(_path().default.resolve(htmlPath));
      } else {
        config.title = extensionName || "Chromium Extension Page";
      }
      webpackConfig.plugins.push(new (_htmlWebpackPlugin().default)(config));
    });
    if (splitChunks) {
      webpackConfig.optimization = _objectSpread(_objectSpread({}, webpackConfig.optimization || {}), {}, {
        splitChunks: _objectSpread({
          cacheGroups: {
            vendor: {
              chunks: "all",
              test: /\.[j|t]s[x]*$/,
              name: vendorDllPath,
              minChunks: 2,
              priority: 1
            }
          }
        }, typeof splitChunks === "object" ? splitChunks : {})
      });
    }
    return webpackConfig;
  });
  function clearAbsPathName(path) {
    const fileText = _fs().default.readFileSync(path, 'utf-8');
    let index = fileText.indexOf("_node_modules_umijs_babel_preset_umi_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0_");
    if (index > 0) {
      while (index--) {
        if (fileText[index] === " ") {
          break;
        }
      }
      const subText = fileText.slice(index);
      const match = subText.match(/^\s*(.*?)_node_modules_umijs_babel_preset_umi_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0_/);
      if (match) {
        const pathName = match[1];
        // console.log(pathName);
        const outText = fileText.replace(new RegExp(pathName, 'g'), "__ROOT__");
        _fs().default.writeFileSync(path, outText, 'utf-8');
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

  function initPluginConfig() {
    return _objectSpread(_objectSpread({}, DefaultConfig), api.userConfig.chromiumExtension || {});
  }
  function initManifestJson() {
    const manifestPath = _path().default.posix.join(rootPath, 'manifest.json');
    const manifestDevPath = _path().default.posix.join(rootPath, 'manifest.dev.json');
    if (!_fs().default.existsSync(manifestPath)) {
      logger.error(`[umi3-plugin-chromium-extension]  manifest file no found:\t${manifestPath}`);
      throw Error();
    }
    let config = JSON.parse(_fs().default.readFileSync(manifestPath, {
      encoding
    }).toString());
    let devConfig = {};
    if (_fs().default.existsSync(manifestDevPath)) {
      devConfig = JSON.parse(_fs().default.readFileSync(manifestDevPath, {
        encoding
      }).toString());
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
          const templateFile = _path().default.posix.join(_path().default.dirname(filePath), `${_path().default.basename(filePath, _path().default.extname(filePath))}.ejs`);
          if (_fs().default.existsSync(templateFile)) {
            findHtml = true;
            userWebpackConfigMap.html[filePathDistKey] = `./${templateFile}`;
          }
          if (!findHtml) {
            const templateFile = _path().default.posix.join(rootPath, `index.ejs`);
            if (_fs().default.existsSync(templateFile)) {
              userWebpackConfigMap.html[filePathDistKey] = `./${templateFile}`;
            } else {
              userWebpackConfigMap.html[filePathDistKey] = '';
            }
          }
          if (filePath.indexOf(optionsPath) === 0) {
            initManifestItemConfig(config, filePath, 'options_ui', {
              "page": _path().default.posix.join(distPathBefore, optionsPathName, "index.html"),
              "open_in_tab": true
            });
          } else if (filePath.indexOf(popupPath) === 0) {
            initManifestItemConfig(config, filePath, 'browser_action', {
              "default_title": config.name,
              "default_popup": _path().default.posix.join(distPathBefore, popupPathName, "index.html")
            });
          } else if (filePath.indexOf(backgroundPath) === 0) {
            initManifestItemConfig(config, filePath, 'background', {
              "page": _path().default.posix.join(distPathBefore, backgroundPathName, "index.html")
            });
          } else {
            logger.warn(`[umi3-plugin-chromium-extension] ignored unknown entry file:\t${filePath}`);
          }
        }
        userWebpackConfigMap.entry[filePathDistKey] = `./${filePath}`;
      });
    }
    if (isDev) {
      config = _objectSpread(_objectSpread({}, config), devConfig);
    }
    return config;
  }
  function initManifestItemConfig(config, mainFilePath, configName, defaultConfig) {
    const configPath = _path().default.posix.join(_path().default.dirname(mainFilePath), configFileName);
    let userConfig = {};
    if (_fs().default.existsSync(configPath)) {
      userConfig = JSON.parse(_fs().default.readFileSync(configPath, {
        encoding
      }).toString());
    }
    config[configName] = _objectSpread(_objectSpread(_objectSpread({}, defaultConfig), config[configName] || {}), userConfig);
  }
  function initManifestContentScriptsItemConfig(config, mainFilePath) {
    const configPath = _path().default.posix.join(_path().default.dirname(mainFilePath), configFileName);
    if (_fs().default.existsSync(configPath)) {
      const info = JSON.parse(_fs().default.readFileSync(configPath, {
        encoding
      }).toString());
      const pathBefore = _path().default.posix.join(distPathBefore, _path().default.posix.dirname(configPath.replace(`${rootPath}/`, '')));
      delete info.text;
      initFilePath(pathBefore, info.js);
      initFilePath(pathBefore, info.css);
      if (splitChunks) {
        info.js.unshift(`${vendorDllPath}.js`);
      }
      config.content_scripts.push(info);
    } else {
      logger.error(`[umi3-plugin-chromium-extension] content scripts configuration file no found:\t ${configPath}`);
      throw Error();
    }
  }
  function initFilePath(path, configList) {
    if (configList) {
      // TODO 判断文件是否存在,然后再加上路径判断是否存在
      for (let i = 0; i < configList.length; i += 1) {
        const name = configList[i];
        if (name.indexOf(path) === -1) {
          configList[i] = _path().default.posix.join(path, name);
        }
      }
    }
  }
  function getFilePathDistKey(path) {
    return _path().default.posix.join(distPathBefore, path.replace(`${rootPath}/`, '').replace(/\.[j|t]s[x]*$/, ''));
  }
  function findFileGroup(pathBefore, fileName) {
    return glob.sync(`${pathBefore}/**/${fileName}`).map(path => _path().default.posix.normalize(path));
  }
  function writeFileSync(filePath, data) {
    const dir = _path().default.dirname(filePath);
    if (!_fs().default.existsSync(dir)) {
      _fs().default.mkdirSync(dir);
    }
    _fs().default.writeFileSync(filePath, data);
  }
  function copyFilesSync(srcPath, destPath, blackList) {
    const files = _fs().default.readdirSync(srcPath);
    var _iterator4 = _createForOfIteratorHelper(files),
      _step4;
    try {
      for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
        let file = _step4.value;
        if (blackList.indexOf(file) === -1) {
          const filePath = _path().default.posix.join(srcPath, file);
          const targetPath = _path().default.posix.join(destPath, file);
          const stat = _fs().default.statSync(filePath);
          if (stat.isDirectory()) {
            if (!_fs().default.existsSync(targetPath)) {
              _fs().default.mkdirSync(targetPath);
            }
            copyFilesSync(filePath, targetPath, blackList);
          } else {
            _fs().default.copyFileSync(filePath, targetPath);
          }
        }
      }
    } catch (err) {
      _iterator4.e(err);
    } finally {
      _iterator4.f();
    }
  }
  function removeFileOrDirSync(filePath) {
    try {
      if (_fs().default.existsSync(filePath)) {
        const STATUS = _fs().default.statSync(filePath);
        if (STATUS.isFile()) {
          // 如果原路径是文件
          //删除原文件
          _fs().default.unlinkSync(filePath);
        } else if (STATUS.isDirectory()) {
          //如果原路径是目录
          //如果原路径是非空目录,遍历原路径
          //空目录时无法使用forEach
          _fs().default.readdirSync(filePath).forEach(item => {
            //递归调用函数，以子文件路径为新参数
            removeFileOrDirSync(`${filePath}/${item}`);
          });
          //删除空文件夹
          _fs().default.rmdirSync(filePath);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  function writeManifestJson(manifestJson, outputPath) {
    if (isDev || !support360) {
      writeFileSync(_path().default.posix.join(outputPath, 'manifest.json'), JSON.stringify(manifestJson, null, 2));
    } else {
      writeFileSync(_path().default.posix.join(outputPath, 'manifest.json'), JSON.stringify(manifestJson, null, 2));
      const manifest360Json = _objectSpread({}, manifestJson);
      manifest360Json['update_url'] = "http://upext.chrome.360.cn/intf.php?method=ExtUpdate.query";
      writeFileSync(_path().default.posix.join(outputPath, '..', '360', 'manifest.json'), JSON.stringify(manifest360Json, null, 2));
    }
  }

  // function getModuleTopParentModule(module) {
  //     let parentModule = module;
  //     while (parentModule.issuer) {
  //         parentModule = parentModule.issuer;
  //     }
  //     怎么也无法格式化\\,只好手动将其替换为/
  // return parentModule;
  // }
}
;