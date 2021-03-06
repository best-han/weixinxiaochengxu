// pages/tankStorage/tankStorage.js
const app=getApp();
var util = require('../../utils/util.js');
const log = require('../../log.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    versionNo: app.globalData.versionNo,
    tankdatas:[],
    devices: [],
    connected: false,
    chs: [],
    //系统信息参数
    //receiveDatas:'',
    receivebattery:'',
    receivedate:'',
    receivemode:'',
    receivealarmStatus:'',
    day:'',
    hour:'',
    mode:'',
    alarm:'',
    batteriesLevel:'',
    //计量信息参数
    receiveinMeasuring:'',
    receiveV20:'',
    receiveVt:'',
    receiveweight:'',
    receiveflowrate:'',
    receivetemperature:'',
    inMeasuring:'',
    V20:'',
    Vt:'',
    weight:'',
    flowrate:'',
    temperature:'',
    //TOTALIZER
    receiveinVm:'',
    receiveVb:'',
    receiveTOTALIZERweight:'',
    Vm:'',
    Vb:'',
    weightTOTALIZER:'',
    //蓝牙连接状态
    receiveconnected:'',
    connected:'',

  },
  //获取系统信息
  getSysInfo(){
    //获取年月日时分秒12045--12050，共5*4位，10个字节，5个寄存器
    var param=app.globalData.readParamHead+'2f0d0006';//
    this.getInfo(param,12045);
    //获取电量12070 (0x2F26) ,1个寄存器 
    //this.getInfo('01032F260001',12070);
  },
  //获取计量信息
  getMEASURING(){
    //获取12200--12223 但是截止到12225，共25*4位，50个字节，25个寄存器
    var param=app.globalData.readParamHead+'2FA80019';//
    this.getInfo(param,12200);
  },
  //获取蓝牙信息26400
  getBluetoothInfo(){
    //获取26400--26401 但是截止到26411，共10*4位，40个字节，10个寄存器
    var param=app.globalData.readParamHead+'6720000a';//
    this.getInfo(param,26400);
  },
   //获取信息
   getInfo(param,address){
    param=param+'0000'
    let bytes=util.Str2Bytes(param);
    var crcBuf=util.calculateCRC(bytes,bytes.length-2);
    //var crcBuf=util.CRC16(bytes);
    bytes[bytes.length-2]=crcBuf[0];
    bytes[bytes.length-1]=crcBuf[1];
    let buffer= new Int8Array(bytes).buffer;//array转arraybuffer-------------
    console.log(buffer);
    //util.startNotice(buffer);
    this.getBLEDeviceCharacteristics(app.globalData.bluetoothInfo.deviceId, app.globalData.bluetoothInfo.serviceId, buffer,0,address) 
  },

  //清空
  cleanData(){
    this.setData({
      tankdatas: []
    });
  },
  //解析day
  processDay(receiveData1) {
    receiveData1=receiveData1.substr(0,6*4+6+4);
    log.info('解析day'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let interval=4;
      let year=parseInt(receiveData1.substr(start,4),16);
      let month=parseInt(receiveData1.substr(start+=interval,4),16);
      let day=parseInt(receiveData1.substr(start+=interval,4),16);
      let date='20'+year+'-'+month+'-'+day;
      console.log('*****日期',date);
      let hour=parseInt(receiveData1.substr(start+=interval,4),16);
      let minute=parseInt(receiveData1.substr(start+=interval,4),16);
      let second=parseInt(receiveData1.substr(start+=interval,4),16);
      let dd=hour+':'+minute+':'+second
      console.log('*****时间',dd);
      this.setData({
        day: date,
        hour: dd
      })
    }

    //模式12000，1个寄存器 
    this.getInfo('01032ee00001',12000);
   
  },
  //解析电量
  processBattery(receiveData1){
    receiveData1=receiveData1.substr(0,1*4+6+4);
    log.info('解析电量'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let level=parseInt(receiveData1.substr(start,4),16);
      console.log('*****电量',level);
      this.setData({
        batteriesLevel: level
      })
    }
    this.getMEASURING();
    
  },
  //解析模式
  processMode(receiveData1){
    receiveData1=receiveData1.substr(0,1*4+6+4);
    log.info('解析模式'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let mode=parseInt(receiveData1.substr(start,4),16);
      console.log('*****模式',mode);
      if(mode===0){//Nornmal
          mode='User';
      }else if(mode===1){//Superviseur
          mode='Superviseur';
      }else if(mode===2){//Metrilogique
        mode='Metrilogique';
      }else if(mode===4){//Resident
        mode='Resident';
      }
      this.setData({
        mode: mode
      })
    }

     //获取电量12070 (0x2F26) ,1个寄存器 
     this.getInfo('01032F260001',12070);
  },
    //解析报警状态？？？？？？
  processAlarmStatus(receiveData1){
    receiveData1=receiveData1.substr(0,1*4+6+4);
    log.info('解析报警状态？？'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let alarm=parseInt(receiveData1.substr(start,4),16);
      console.log('*****alarm',alarm);
      this.setData({
        alarm: alarm
      })
    }
    
  },
  //解析计量信息
  processMEASURING(receiveData1){
    receiveData1=receiveData1.substr(0,25*4+6+4);
    log.info('解析计量信息'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let inMeasuring=parseInt(receiveData1.substr(start,4),16);
      let Vm=this.convertFloat8(receiveData1.substr(start+=4,8));
      let Vb=this.convertFloat8(receiveData1.substr(start+=8,8));
      let weight=this.convertFloat8(receiveData1.substr(start+=8,8));
      let VmTOTALIZER=this.convertFloat16(receiveData1.substr(start+=8,16));
      let VbTOTALIZER=this.convertFloat16(receiveData1.substr(start+=16,16));
      let weightTOTALIZER=this.convertFloat16(receiveData1.substr(start+=16,16));
      let flowrate=this.convertFloat8(receiveData1.substr(start+=16,8));
      console.log('&&&&&&&&&&&',receiveData1.substr(start+16,8));
      let temperature=this.convertFloat8(receiveData1.substr(start+=16,8)).toFixed(2);


      this.setData({
        inMeasuring: inMeasuring,
        V20:Vm,
        Vt:Vb,
        weight:weight,
        Vm:VmTOTALIZER,
        Vb:VbTOTALIZER,
        weightTOTALIZER:weightTOTALIZER,
        flowrate:flowrate,
        temperature:temperature
      })
    }
    this.getBluetoothInfo();
  },
  //解析蓝牙信息
  processBluetooth(receiveData1){
    receiveData1=receiveData1.substr(0,10*4+6+4);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let bluetooth=parseInt(receiveData1.substr(start,4),16);
      console.log('*****bluetooth',bluetooth);
      if(bluetooth===1){
        bluetooth='已连接'
      }else{
        bluetooth='未连接'
      }
      this.setData({
        connected: bluetooth
      })
    }
  },

  //大小为4的arrayBuffer转为Float
  abConvertFloat(buffer) {
    //var buffer = this.str2ArrayBuffer(byteStr, 4);
    var dataView = new DataView(buffer, 0, 4);
    return dataView.getFloat32(0);
  },
  //4个字节型字符串转为Float
  convertFloat(byteStr) {
    var buffer = this.str2ArrayBuffer(byteStr, 4);
    var dataView = new DataView(buffer, 0, 4);
    return dataView.getFloat32(0);
  },
  //8个字节型字符串转为Float
  convertFloat8(byteStr) {
    var buffer = this.str2ArrayBuffer(byteStr, 8);
    var dataView = new DataView(buffer, 0, 8);
    return dataView.getFloat32(0);
  },
  //16个字节型字符串转为Float
  convertFloat16(byteStr) {
    var buffer = this.str2ArrayBuffer(byteStr, 16);
    var dataView = new DataView(buffer, 0, 16);
    return dataView.getFloat64(0);
  },
  // 字符串转为ArrayBuffer对象，参数为字符串
  str2ArrayBuffer(str, len) {
    var buf = new ArrayBuffer(len);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = parseInt(str.substr(i * 2, 2), 16);
    }
    return buf;
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      versionNo : app.globalData.versionNo
    })
    util.onBLEConnectionState();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.getSysInfo();
    
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

  //获取特征值到写数据和监听等流程
  getBLEDeviceCharacteristics(deviceId, serviceId, buffer, from, address) {
    var that=this;
    serviceId='0EF85A60-1DFC-11E6-8EC4-0002A5D5C51B'
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        console.log('获取特征值属性');
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.notify ) {
            console.log('开启 notify ');
            this._characteristicId = item.uuid
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
              success (res) {
                console.log('notifyBLECharacteristicValueChange success', res.errMsg)
                wx.writeBLECharacteristicValue({
                  deviceId: deviceId,
                  serviceId: serviceId,
                  characteristicId: '0EF85A61-1DFC-11E6-8EC4-0002A5D5C51B',
                  value: buffer,
                  success: function (res) {
                    //console.log('发送的数据：' + that.writeDatas)
                    console.log('message发送成功')
                    // wx.showModal({
                    //   title: '数据发送成功',
                    //   content: ''
                    // })
                    setTimeout(function(){
                      //延迟后进行的操作
                      that.readBLECharacteristicValue(2,address);   
                    },300)   
                    
                  },
                  fail: function (res) {
                    // fail
                    console.log('message发送失败'+res.errCode)
                    wx.showToast({
                      title: '数据发送失败，请稍后重试',
                      icon: 'none'
                    })
                  },
                  complete: function (res) {
                    // fail
                    console.log('message发送完成')
                  }
                })
              }
            })
          }
        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
   
  },
  //读
  readBLECharacteristicValue(index,address){
    let that=this;
    wx.readBLECharacteristicValue({
      deviceId: app.globalData.bluetoothInfo.deviceId,
      serviceId: app.globalData.bluetoothInfo.serviceId,
      characteristicId: 'EF85A6'+index+'-1DFC-11E6-8EC4-0002A5D5C51B',//'EF85A62-1DFC-11E6-8EC4-0002A5D5C51B'
      success: function (res) {
        console.log('读取数据成功')
        wx.onBLECharacteristicValueChange((characteristic) => {
          console.info('**********开启监听',index);
          // this.setData(data)
          console.log('接收到数据源码：',characteristic.value);
          let dataRe=that.ab2hex(characteristic.value);
          console.log('接收到数据16进制：',dataRe);
          if(address===12045){
            that.setData({
              receivedate:that.data.receivedate.concat(dataRe)
            })
          }
          if(address===12070){
            that.setData({
              receivebattery:that.data.receivebattery.concat(dataRe)
            })
          }
          if(address===12000){
            that.setData({
              receivemode:that.data.receivemode.concat(dataRe)
            })
          }
          if(address===12071){
            that.setData({
              receivealarmStatus:that.data.receivealarmStatus.concat(dataRe)
            })
          }
          if(address===12200){
            that.setData({
              receiveinMeasuring:that.data.receiveinMeasuring.concat(dataRe)
            })
          }
          if(address===26400){
            that.setData({
              receiveconnected:that.data.receiveconnected.concat(dataRe)
            })
          }

         // console.log('接收到数据16进制++：',that.data.receiveDatas);
          index++;
          if(address===12045 && index>2){//date
            that.processDay(that.data.receivedate);
          }else
          if(address===12070 && index>2){//batterieslevel
            that.processBattery(that.data.receivebattery);
          }else
          if(address===12000 && index>2){//mode
            that.processMode(that.data.receivemode);
          }else
          if(address===12071 && index>2){//alarmStatus
            that.processAlarmStatus(that.data.receivealarmStatus);
          }else
          if(address===12200 && index>4){//计量
            that.processMEASURING(that.data.receiveinMeasuring);
          }else
          if(address===26400 && index>3){//蓝牙
            that.processBluetooth(that.data.receiveconnected);
          }else{
            that.readBLECharacteristicValue(index,address);
          }

        })
      }
    })
 },

  //arrays成员类型可以是 ArrayBuffer 或 TypeArray
 mergeArrayBuffer(...arrays) {
  let totalLen = 0
  for (let i = 0; i < arrays.length; i++) {
      arrays[i] = new Uint8Array(arrays[i]) //全部转成Uint8Array
      totalLen += arrays[i].length
  }
  let res = new Uint8Array(totalLen)
  let offset = 0
  for(let arr of arrays) {
      res.set(arr, offset)
      offset += arr.length
  }
  return res.buffer
  },
  inArray(arr, key, val) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][key] === val) {
        return i;
      }
    }
    return -1;
  },
  
  // ArrayBuffer转16进度字符串示例
  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  }


})