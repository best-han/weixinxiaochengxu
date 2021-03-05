import event from '../../pdffiles/event';
import '../../pdffiles/wxPromise.min.js';
const pdfutil = require('../../pdffiles/util');
const Dialog = require('../../zan-ui/dialog/dialog');
import vanDialog from '../../van-ui/dialog/dialog';
const request = require('../../pdffiles/requests');
import Toast from '../../van-ui/toast/toast';

const app=getApp();
var util = require('../../utils/util.js');
const log = require('../../log.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    versionNo: app.globalData.versionNo,
    height:380,
    receiveMeasurementDay:'',
    receiveMeasurementDayTotalNum:'',
    receiveMeasurementDayNum:'',
    receiveMeasurementsInfo1:'',
    receiveMeasurementsInfo2:'',

    wordOrPDF:true,
    //列表循环展示数据
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
    'longitude':''}
    ],//数据信息数组
    measurement2:[
    {'flowrate':'',
    'direction':'',
    'Signigifiantdefault':'',
    'NoSignigifiantdefault':''
    }
  ],//数据信息数组

    date1:'',//开始时间
    date2:'',//结束时间
    index:'',//当天数据第几条
    shows: true,

    printDate:'',
    //选中页面展示数据
    OperationID:'',
    date:'',
    startTime:'',
    endTime:'',
    oilCode:'',
    oilName:'',
    density:'',
    Vt:'',
    temp:'',
    V20:'',
    direction:'',
    flowrate:'',
    mass:'',
    Signigifiantdefault:'',
    NoSignigifiantdefault:'',
    latitude:'',
    longitude:'',

  },
  
  setMeasurementInfo(i){
    const items = this.data.measurementsInfo;
    const measurement = items[i];
    this.setData({
      OperationID:measurement.OperationID,
      date:measurement.date,
      startTime:measurement.startTime,
      endTime:measurement.endTime,
      oilCode:measurement.oilCode,
      oilName:measurement.oilName,
      density:measurement.density,
      Vt:measurement.Vt,
      temp:measurement.temp,
      V20:measurement.V20,
      direction:measurement.direction,
      flowrate:measurement.flowrate,
      mass:measurement.mass,
      Signigifiantdefault:measurement.Signigifiantdefault,
      NoSignigifiantdefault:measurement.NoSignigifiantdefault,
      latitude:measurement.latitude,
      longitude:measurement.longitude,
    })
  },

  //下载pdf
  upload(){
    //var that=this;
    wx.canvasToTempFilePath({
      canvasId: 'wordCanvas',
      success: function success(res) {

        wx.downloadFile({
          url: res.tempFilePath,
          success (res) {
              wx.saveFile({
                  tempFilePath: res.tempFilePath,
                  success (res) {
                      console.log('下载成功')
                  },
                  fail(error){
                    console.log('下载失败')
                  }
              })
          }
      })

        // wx.saveFile({
        //   tempFilePath: res.tempFilePath,
        //   success: function success(res) {
        //     console.log('saved::' + res.savedFilePath);
        //   },
        //   complete: function fail(e) {
        //     console.log(e.errMsg);
        //   }
        // });
      },
      complete: function complete(e) {
        console.log(e.errMsg);
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      versionNo : app.globalData.versionNo,
      wordOrPDF: app.globalData.wordOrPDF,
      printDate: (new Date()).toLocaleDateString()+","+(new Date()).toLocaleTimeString()
    })
    var ctx = wx.createCanvasContext('wordCanvas');
    const measurement1=app.globalData.measurement1;
    const measurement2=app.globalData.measurement2;
    //设置画布高度
    this.setData({
      height: 380*measurement1.length
    });
    //ctx.setFillStyle('#5F6FEE')//文字颜色：默认黑色
    ctx.setFontSize(16)//设置字体大小，默认10
    for(let i=0,j=1;i<measurement1.length;i++){
      ctx.fillText("打印时间："+this.data.printDate, 20, 20*j)//绘制文本
      ctx.fillText("公司名称：青岛澳科有限公司", 20, 20*(++j))
      ctx.fillText("企业税号：99999999999", 20, 20*(++j))
      ctx.fillText("地址：青岛市黄岛区上海路16号", 20, 20*(++j))
      ctx.fillText("电话：13333333333", 20, 20*(++j))

      ctx.fillText("软件版本："+app.globalData.versionNo, 20, 20*(j+=2))
      ctx.fillText("时间："+measurement1[i].date, 20, 20*(++j))
      ctx.fillText("记录号："+measurement1[i].OperationID, 20, 20*(++j))
      ctx.fillText("油品名："+measurement1[i].oilName, 20, 20*(++j))
      ctx.fillText("测量体积："+measurement1[i].volume, 20, 20*(++j))
      ctx.fillText("温度"+measurement1[i].temp, 20, 20*(++j))
      ctx.fillText("重量："+measurement1[i].mass, 20, 20*(++j))
      ctx.fillText("平均流速："+measurement2[i].flowrate, 20, 20*(++j))
      ctx.fillText("经度："+measurement1[i].longitude, 20, 20*(++j))
      ctx.fillText("纬度："+measurement1[i].latitude, 20, 20*(++j))
      ctx.fillText("备注：", 20, 20*(++j))
      ctx.fillText("_______________________________________", 20, 20*(++j))
      j+=2;
    }
    //调用draw()开始绘制
    ctx.draw()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  


})