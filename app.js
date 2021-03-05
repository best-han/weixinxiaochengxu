//app.js
import './pdffiles/wxPromise.min.js';
import locales from './pdffiles/locales';
import T from './pdffiles/i18n';
require('./prototypes');
// const update = require('./utils/update');

T.registerLocale(locales);
let savedGlobalData = wx.getStorageSync('globalData');
let langIndex = savedGlobalData.langIndex || 0;
T.setLocaleByIndex(langIndex);
wx.T = T;

App({
  onLaunch: function () {

    // this.globalData = savedGlobalData || 
    //   {
    //     // Language settings
    //     langIndex: 0,
    //     languages: locales,
    //     language: locales['zh-Hans'],
    //     // Login status
    //     logged: false,
    //     // Student ID, name
    //     stuId: null,
    //     stuName: null,
    //     stuPassword: null,
    //     // Check in/out status
    //     checkedIn: false
    //   };
    
    // // load all update in locales.js
    // this.globalData.language = wx.T.getLanguage();



    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    var _this=this;
    wx.login({
      timeout: 1000,
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        const code = res.code;
        console.log('code',code);
        // 设置appid  正式：wx0e26779d7a7a2850
        const appId = "wx076438b4e432a1c3";
        // const appid = res.appid;
        //设置secret  正式：81f460c4964d660829c4c1c486b7e7e1
        const secret = "5bd5bd65bd3e82461fa56a61eb706c16";
        wx.request({
          url: 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appId  + '&secret=' + secret + '&js_code=' + code  + '&grant_type=authorization_code',
          data: {},
          header: {
            'content-type': 'json'
          },
          success: function (res) {
            let openId = res.data.openid; //返回openid
            console.log('获取到openid',openId);
            _this.globalData.checkOpenIdValidation=true;//用于授信平台新接口还没发布
            console.log('是否授权',_this.globalData.checkOpenIdValidation);
            wx.request({
              url: 'http://key.exaccu.com/weixin4pwd/weixin/checkOpenIdValidation', 
               data: {
                 openid: openId
               },
               header: {
                 'content-type': 'application/json' // 默认值
               },
               success (res) {
                 console.log(res.data);
                 _this.globalData.checkOpenIdValidation=true;
                
               },
               fail(res){
                console.log('接口调用失败');
                
               }
            });
            
          }
        })
      }
    })


  },

  onHide: function() {
    wx.setStorage({
      key: 'globalData',
      data: this.globalData
    });
  },


  getUserInfo:function(cb){
    var that = this
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function () {
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.userInfo
              typeof cb == "function" && cb(that.globalData.userInfo)
            }
          })
        }
      })
    }
  },
  globalData:{
    userInfo:null,
    bluetoothInfo:{
      deviceId:'111',
      serviceId:'',
      characteristicId:''
    },
    versionNo: '',
    checkOpenIdValidation: false,
    readParamHead: '0103',
    writeParamHead: '0107',

    //wordOrPDF true:word形式
    wordOrPDF:true,
    //存放历史记录选中信息，用于pdf页面展示
    measurementsInfo:[
      {"OperationID":"01","Vt":"1000","V20":"1000","oilName":"type1","operateTime":"type1"},
      ],
      measurement1:[
        {'OperationID':'',
        'date':'',
        'startTime':'',
        'endTime':'',
        'oilCode':'',
        'oilName':'',
        'density':'',
        'Vt':'',
        'temp':'',
        'V20':'',
        'mass':'',
        'latitude':'',
        'longitude':''},
        {'OperationID':'',
        'date':'',
        'startTime':'',
        'endTime':'',
        'oilCode':'',
        'oilName':'',
        'density':'',
        'Vt':'',
        'temp':'',
        'V20':'',
        'mass':'',
        'latitude':'',
        'longitude':''}
        ],//数据信息数组
        measurement2:[
        {'flowrate':'',
        'Signigifiantdefault':'',
        'direction':'',
        'NoSignigifiantdefault':''
        },
        {'flowrate':'',
        'direction':'',
        'Signigifiantdefault':'',
        'NoSignigifiantdefault':''
        }
      ],//数据信息数组
      printVolume:'',
  }
})