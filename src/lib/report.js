import utils from './utils';
import Config from './config';
import Events from './events';

class Report extends Events {
    constructor(options) {
      super(options);
      this.errorQueue = []; // 记录错误队列
      this.repeatList = {}; // 记录重复异常数据
      this.config = new Config().config;
      ['log', 'debug', 'info', 'warn', 'error'].forEach((type, index) => {
        this[type] = msg => this.handleMsg(msg, type, index);
      });
    }

    // 重复出现的错误，只上报config.repeat次
    repeat(error) {
      const rowNum = error.rowNum || '';
      const colNum = error.colNum || '';
      const repeatName = error.msg + rowNum + colNum;
      this.repeatList[repeatName] = this.repeatList[repeatName]
        ? this.repeatList[repeatName] + 1
        : 1;
      return this.repeatList[repeatName] > this.config.repeat;
    }

    // 忽略错误
    except(error) {
      const oExcept = this.config.except;
      let result = false;
      let v = null;
      if (utils.typeDecide(oExcept, 'Array')) {
        for (let i = 0, len = oExcept.length; i < len; i++) {
          v = oExcept[i];
          if ((utils.typeDecide(v, 'RegExp') && v.test(error.msg))) {
            result = true;
            break;
          }
        }
      }
      return result;
    }

    // 请求服务端
    request(url, params, cb) {
      if (!this.config.key) {
        throw new Error('please set key in IGNBdebug.config.key');
      }
      params.key = this.config.key;
      wx.request({
        url,
        method: 'POST',
        data: params,
        success: cb,
      });
    }

    report(cb) {
      const { mergeReport } = this.config;
      if (this.errorQueue.length === 0) return this.config.url;
      const curQueue = mergeReport ? this.errorQueue : [this.errorQueue.shift()];
      if (mergeReport) this.errorQueue = [];
      const { url } = this.config;
      const params = {
        error: curQueue,
        systemInfo: this.systemInfo,
        breadcrumbs: this.breadcrumbs,
        locationInfo: this.locationInfo,
        networkType: this.networkType,
        notifierVersion: this.config.version,
      };
      this.request(url, params, () => {
        if (cb) {
          cb.call(this);
        }
        this.trigger('afterReport');
      });
      return url;
    }

    // 发送
    send(cb) {
      if (!this.trigger('beforeReport')) return;
      const callback = cb || utils.noop;
      const delay = this.config.mergeReport ? this.config.delay : 0;
      setTimeout(() => {
        this.report(callback);
      }, delay);
    }

    // push错误到pool
    catchError(error) {
      const rnd = Math.random();
      // 抽样
      if (rnd >= this.config.random) {
        return false;
      }
      // 去重
      if (this.repeat(error)) {
        return false;
      }
      // 过滤
      if (this.except(error)) {
        return false;
      }
      this.errorQueue.push(error);
      return this.errorQueue;
    }

    // 手动上报
    handleMsg(msg, type, level) {
      if (!msg) {
        return false;
      }
      // 构造一个errorMsg的对象
      const errorMsg = utils.typeDecide(msg, 'Object') ? msg : { msg };
      errorMsg.level = level;
      errorMsg.type = type;
      if (this.catchError(errorMsg)) {
        this.send();
      }
      return errorMsg;
    }
  }

export default Report;
