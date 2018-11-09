(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.IGNBdebug = factory());
}(this, (function () {
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  var utils = {
    typeDecide: function typeDecide(o, type) {
      return Object.prototype.toString.call(o) === "[object ".concat(type, "]");
    },
    isFunction: function isFunction(f) {
      return utils.typeDecide(f, 'Function');
    },
    isString: function isString(f) {
      return utils.typeDecide(f, 'String');
    },
    serializeObj: function serializeObj(obj) {
      var parames = '';
      Object.keys(obj).forEach(function (name) {
        if (utils.typeDecide(obj[name], 'Object')) {
          parames += "".concat(name, "=").concat(JSON.stringify(obj[name]));
        } else {
          parames += "".concat(name, "=").concat(obj[name], "^");
        }
      });
      return encodeURIComponent(parames.substr(0, parames.length - 1));
    },
    noop: function noop() {},
    now: function now() {
      return new Date().getTime();
    }
  };

  var Config =
  /*#__PURE__*/
  function () {
    function Config(options) {
      _classCallCheck(this, Config);

      this.config = {
        version: '1.0.0',
        setSystemInfo: false,
        setLocation: false,
        key: '',
        mergeReport: true,
        // mergeReport 是否合并上报， false 关闭， true 启动（默认）
        delay: 1000,
        // 当 mergeReport 为 true 可用，延迟多少毫秒，合并缓冲区中的上报（默认）
        url: '',
        // 指定错误上报地址
        except: [/^Script error\.?/, /^Javascript error: Script error\.? on line 0/],
        // 忽略某个错误
        random: 1,
        // 抽样上报，1~0 之间数值，1为100%上报（默认 1）
        repeat: 5 // 重复上报次数(对于同一个错误超过多少次不上报)

      };
      this.config = Object.assign(this.config, options);
    }

    _createClass(Config, [{
      key: "get",
      value: function get(name) {
        return this.config[name];
      }
    }, {
      key: "set",
      value: function set(name, value) {
        this.config[name] = value;
        return this.config[name];
      }
    }]);

    return Config;
  }();

  /**
   * 事件管理器
   */
  var Events =
  /*#__PURE__*/
  function () {
    function Events() {
      _classCallCheck(this, Events);

      this.handlers = {};
    }
    /**
     * 事件注册
     * @param {*} event 事件名字
     * @param {*} handlers 执行函数
     */


    _createClass(Events, [{
      key: "on",
      value: function on(event, handlers) {
        this.handlers[event] = this.handlers[event] || [];
        this.handlers[event].push(handlers);
        return this.handlers[event];
      }
      /**
       * 事件注销
       * @param {*} event 事件名字
       */

    }, {
      key: "off",
      value: function off(event) {
        if (this.handlers[event]) {
          delete this.handlers[event];
        }
      }
      /**
       * 触发事件
       * @param {*} event 事件名字
       * @param {*} args 执行参数
       */

    }, {
      key: "trigger",
      value: function trigger(event, args) {
        var _this = this;

        var arg = args || [];
        var funcs = this.handlers[event];

        if (funcs) {
          return funcs.every(function (f) {
            var ret = f.apply(_this, arg);
            return ret !== false;
          });
        }

        return true;
      }
    }]);

    return Events;
  }();

  var Report =
  /*#__PURE__*/
  function (_Events) {
    _inherits(Report, _Events);

    function Report(options) {
      var _this;

      _classCallCheck(this, Report);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(Report).call(this, options));
      _this.errorQueue = []; // 记录错误队列

      _this.repeatList = {}; // 记录重复异常数据

      _this.config = new Config().config;
      ['log', 'debug', 'info', 'warn', 'error'].forEach(function (type, index) {
        _this[type] = function (msg) {
          return _this.handleMsg(msg, type, index);
        };
      });
      return _this;
    } // 重复出现的错误，只上报config.repeat次


    _createClass(Report, [{
      key: "repeat",
      value: function repeat(error) {
        var rowNum = error.rowNum || '';
        var colNum = error.colNum || '';
        var repeatName = error.msg + rowNum + colNum;
        this.repeatList[repeatName] = this.repeatList[repeatName] ? this.repeatList[repeatName] + 1 : 1;
        return this.repeatList[repeatName] > this.config.repeat;
      } // 忽略错误

    }, {
      key: "except",
      value: function except(error) {
        var oExcept = this.config.except;
        var result = false;
        var v = null;

        if (utils.typeDecide(oExcept, 'Array')) {
          for (var i = 0, len = oExcept.length; i < len; i++) {
            v = oExcept[i];

            if (utils.typeDecide(v, 'RegExp') && v.test(error.msg)) {
              result = true;
              break;
            }
          }
        }

        return result;
      } // 请求服务端

    }, {
      key: "request",
      value: function request(url, params, cb) {
        if (!this.config.key) {
          throw new Error('please set key in IGNBdebug.config.key');
        }

        params.key = this.config.key;
        wx.request({
          url: url,
          method: 'POST',
          data: params,
          success: cb
        });
      }
    }, {
      key: "report",
      value: function report(cb) {
        var _this2 = this;

        var mergeReport = this.config.mergeReport;
        if (this.errorQueue.length === 0) return this.config.url;
        var curQueue = mergeReport ? this.errorQueue : [this.errorQueue.shift()];
        if (mergeReport) this.errorQueue = [];
        var url = this.config.url;
        var params = {
          error: curQueue,
          systemInfo: this.systemInfo,
          breadcrumbs: this.breadcrumbs,
          locationInfo: this.locationInfo,
          networkType: this.networkType,
          notifierVersion: this.config.version
        };
        this.request(url, params, function () {
          if (cb) {
            cb.call(_this2);
          }

          _this2.trigger('afterReport');
        });
        return url;
      } // 发送

    }, {
      key: "send",
      value: function send(cb) {
        var _this3 = this;

        if (!this.trigger('beforeReport')) return;
        var callback = cb || utils.noop;
        var delay = this.config.mergeReport ? this.config.delay : 0;
        setTimeout(function () {
          _this3.report(callback);
        }, delay);
      } // push错误到pool

    }, {
      key: "catchError",
      value: function catchError(error) {
        var rnd = Math.random(); // 抽样

        if (rnd >= this.config.random) {
          return false;
        } // 去重


        if (this.repeat(error)) {
          return false;
        } // 过滤


        if (this.except(error)) {
          return false;
        }

        this.errorQueue.push(error);
        return this.errorQueue;
      } // 手动上报

    }, {
      key: "handleMsg",
      value: function handleMsg(msg, type, level) {
        if (!msg) {
          return false;
        } // 构造一个errorMsg的对象


        var errorMsg = utils.typeDecide(msg, 'Object') ? msg : {
          msg: msg
        };
        errorMsg.level = level;
        errorMsg.type = type;

        if (this.catchError(errorMsg)) {
          this.send();
        }

        return errorMsg;
      }
    }]);

    return Report;
  }(Events);

  var IGNBDebug =
  /*#__PURE__*/
  function (_Report) {
    _inherits(IGNBDebug, _Report);

    function IGNBDebug(options) {
      var _this;

      _classCallCheck(this, IGNBDebug);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(IGNBDebug).call(this, options));
      _this.breadcrumbs = []; // 函数执行面包屑

      _this.activePage = {};

      _this.rewriteApp();

      _this.rewritePage();

      return _this;
    } // 劫持原小程序App方法


    _createClass(IGNBDebug, [{
      key: "rewriteApp",
      value: function rewriteApp() {
        var _this2 = this;

        var originApp = App;
        var self = this;

        App = function App(app) {
          // 合并方法，插入记录脚本
          ['onLaunch', 'onShow', 'onHide', 'onError'].forEach(function (methodName) {
            var userDefinedMethod = app[methodName]; // 暂存用户定义的方法

            if (methodName === 'onLaunch') {
              // 获取配置
              self.getNetworkType();
              self.config.setLocation && self.getLocation();
              self.config.setSystemInfo && self.getSystemInfo();
            }

            app[methodName] = function (options) {
              var breadcrumb = {
                type: 'function',
                time: utils.now(),
                belong: 'App',
                // 来源
                method: methodName,
                path: options && options.path,
                // 页面路径
                query: options && options.query,
                // 页面参数
                scene: options && options.scene // 场景编号

              };
              self.pushToBreadcrumb(breadcrumb); // 把执行对象加入到面包屑中

              methodName === 'onError' && self.error({
                msg: options
              }); // 错误上报

              return userDefinedMethod && userDefinedMethod.call(_this2, options);
            };
          });
          return originApp(app);
        };
      } // 劫持原小程序Page方法

    }, {
      key: "rewritePage",
      value: function rewritePage() {
        var _this3 = this;

        var originPage = Page;

        Page = function Page(page) {
          Object.keys(page).forEach(function (methodName) {
            typeof page[methodName] === 'function' && _this3.recordPageFn(page, methodName);
          }); // 强制记录两生命周期函数

          page.onReady || _this3.recordPageFn(page, 'onReady');
          page.onLoad || _this3.recordPageFn(page, 'onLoad'); // 执行原Page对象

          return originPage(page);
        };
      } // 获取当前显示的页面

    }, {
      key: "getActivePage",
      value: function getActivePage() {
        var curPages = getCurrentPages();

        if (curPages.length) {
          return curPages[curPages.length - 1];
        }

        return {};
      } // 记录函数执行情况，最多记录20个

    }, {
      key: "pushToBreadcrumb",
      value: function pushToBreadcrumb(obj) {
        this.breadcrumbs.push(obj);
        this.breadcrumbs.length > 20 && this.breadcrumbs.shift();
      } // 记录Page执行信息

    }, {
      key: "recordPageFn",
      value: function recordPageFn(page, methodName) {
        var userDefinedMethod = page[methodName];
        var self = this;

        page[methodName] = function () {
          if (methodName === 'onLoad' || methodName === 'onShow') {
            self.activePage = self.getActivePage();
          }

          var breadcrumb = {
            type: 'function',
            time: utils.now(),
            belong: 'Page',
            method: methodName,
            route: self.activePage && self.activePage.route,
            options: self.activePage && self.activePage.options
          };
          methodName === 'onLoad' && (breadcrumb.args = arguments);
          self.methodFilter(methodName) && self.pushToBreadcrumb(breadcrumb);
          return userDefinedMethod && userDefinedMethod.apply(this, arguments);
        };
      } // 过滤方法，可以在这里做黑白名单

    }, {
      key: "methodFilter",
      value: function methodFilter(methodName) {
        return methodName !== 'onPageScroll'; // 把onPageScroll方法过滤掉
      }
    }, {
      key: "getNetworkType",
      value: function getNetworkType() {
        var _this4 = this;

        wx.getNetworkType({
          success: function success(res) {
            _this4.networkType = res.networkType;
          }
        });
      }
    }, {
      key: "getSystemInfo",
      value: function getSystemInfo() {
        var _this5 = this;

        wx.getSystemInfo({
          success: function success(res) {
            _this5.systemInfo = res;
          }
        });
      }
    }, {
      key: "getLocation",
      value: function getLocation() {
        var _this6 = this;

        wx.getLocation({
          type: 'wgs84',
          success: function success(res) {
            _this6.locationInfo = res;
          }
        });
      }
    }]);

    return IGNBDebug;
  }(Report);

  var IGNBdebug = new IGNBDebug();

  return IGNBdebug;

})));