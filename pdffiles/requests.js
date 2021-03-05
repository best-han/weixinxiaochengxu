/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
const request = wx.pro.request;
const service = require('../config').service;
import Notify from '../van-ui/notify/notify';
import Toast from '../van-ui/toast/toast';
const Base64 = require('./base64.min.js').Base64;
import util from './util';

const globalData = getApp().globalData;

function errorHandler(err) {
  console.error(err);
  Toast.clear();
  Notify(globalData.language.requestError + ': ' + JSON.stringify(err.errMsg));
}

function statusCodeChecker(res) {
  console.log(res);
  Toast.clear();
  if(res.statusCode === 200) {
    // Notify({
    //   text: globalData.language.requestSuccess,
    //   backgroundColor: '#38f'
    // });
  } else {
    Notify({
      text: globalData.language.requestError + ': ' + res.statusCode + ' ' + globalData.language[res.statusCode] + ' ' + JSON.stringify(res.data)
    });
    // Throw error with message from the server
    throw Error(res.data);
  }
  return res;
}

module.exports = {
  /**
   * Login and get a token. 
   */
  login(id, password) {
    Toast.loading({
      duration: 0,
      forbidClick: true,
      message: globalData.language.logining
    });
    return request({
      url: service.login,
      method: 'POST',
      data: {
        id,
        password
      }
    }).catch(errorHandler)
      .then(statusCodeChecker)
      .catch(() => {
        throw Error(globalData.language.loginFailed);
      });
  },

  getAllUsersInfo() {

  },
  /**
   * Get specific id user info using current token.
   */
  getUserInfo(id) {
    return request({
      url: service.user + '/' + id,
      method: 'GET',
      header: {
        'x-access-token': globalData.token
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },

  updateUser(id, user) {
    return request({
      url: service.user + '/' + id,
      method: 'PUT',
      header: {
        'x-access-token': globalData.token
      },
      data: user
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },

  addCheck(id, isIn, isMorning) {
    return request({
      url: service.check,
      method: 'POST',
      header: {
        'x-access-token': globalData.token
      },
      data: {
        id,
        in: isIn,
        morning: isMorning
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },
  getMonthlyChecks(id, year, month) {
    return request({
      url: service.check + `/${id}`,
      method: 'GET',
      header: {
        'x-access-token': globalData.token
      },
      data: {
        year,
        month
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },

  addShift(id, year, month, day, isMorning, status) {
    return request({
      url: service.shift,
      method: 'POST',
      header: {
        'x-access-token': globalData.token
      },
      data: {
        id,
        year,
        month,
        day,
        morning: isMorning,
        status
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },
  /**
   * Get all shifts during filter.
   * @param {Object} filter year, startMonth, startDay, endMonth, endDay
   */
  getShifts(filter) {
    return request({
      url: service.shift,
      method: 'GET',
      header: {
        'x-access-token': globalData.token
      },
      data: filter
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },
  /**
   * Get all shifts during filter.
   * @param {Object} filter year, startMonth, startDay, endMonth, endDay
   */
  getShiftsById(id, filter) {
    return request({
      url: service.shift + `/${id}`,
      method: 'GET',
      header: {
        'x-access-token': globalData.token
      },
      data: filter
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },
  deleteShift(shift_id) {
    return request({
      url: service.shift + `/${shift_id}`,
      method: 'DELETE',
      header: {
        'x-access-token': globalData.token
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },
  register(user, registerCode) {
    return request({
      url: service.register,
      method: 'POST',
      data: {
        user,
        registerCode
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },

  getRawVideoUrl(videoId, username, password) {    
    let auth = 'Basic ' + Base64.encode(username + ':' + password);
    return request({
      url: `${service.stream}/${videoId}`,
      method: 'GET',
      header: {
        Authorization: auth
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },
  
  getNotices() {
    return request({
      url: service.notice,
      header: {
        'x-access-token': globalData.token
      },
      method: 'GET'
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },
  addNotice(subject, content) {
    return request({
      url: service.notice,
      method: 'POST',
      header: {
        'x-access-token': globalData.token
      },
      data: {
        subject,
        content
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);  
  },

  getVideos() {
    return request({
      url: service.video,
      header: {
        'x-access-token': globalData.token
      },
      method: 'GET'
    }).catch(errorHandler)
      .then(statusCodeChecker);
  },
  addVideo(subject, desc, video_code) {
    return request({
      url: service.video,
      method: 'POST',
      header: {
        'x-access-token': globalData.token
      },
      data: {
        subject,
        desc,
        video_code
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);  
  },

  getKxjs(buildingCode, date) {
    return request({
      url: service.wxKxjs,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: {
        info: JSON.stringify({
          lhdm: buildingCode,
          rq: date
        })
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);  
  },

  getPDFByHTML(html) {
    util.show(globalData.language.saving, 'loading');
    return request({
      url: service.html2pdf,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      data: {
        html
      }
    }).catch(errorHandler)
      .then(statusCodeChecker);
  }
};