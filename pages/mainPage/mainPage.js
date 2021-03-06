
const app=getApp();
var util = require('../../utils/util.js');
const log = require('../../log.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    receivebluetooth: '',
    getInfo: '发送指令获取信息',
    monitoring: '监控',
    measurements: '历史记录',
    superivisor: "管理员模式",
    metrologic: "设备参数",
    versionNo: app.globalData.versionNo,
  },

  toBluetooth:function(){
    console.info("跳转到连接蓝牙设备");
    wx.redirectTo({
      url: '../bluetooth/bluetooth',
    })
    
  },
  toGetInfo:function(){
    console.info("跳转到获取信息页面");
    wx.redirectTo({
      url: '../getInfo/getInfo',
    })
    
  },

  toMonitoring:function(){
    console.info("跳转到监控页面");
    wx.redirectTo({
      url: '../monitoring/monitoring',
    })
    
  },
  toMeasurements:function(){
    console.info("跳转到历史记录页面");
    wx.redirectTo({
      url: '../measurements/measurements',
    })
    
  },
  toSuperivisor:function(){
    console.info("跳转到管理员模式页面");
    wx.redirectTo({
      url: '../superivisor/superivisor',
    })
    
  },
  toMetrologic:function(){
    console.info("跳转到设备参数页面");
    wx.redirectTo({
      url: '../metrologic/metrologic',
    })
   
  },
  //首先发送指令获取产品编号
  //获取蓝牙信息26401  
  getBluetoothInfo(){
    //获取26401--26410 但是截止到26411，共10*4位，40个字节，10个寄存器
    var param=app.globalData.readParamHead+'6721000A';//
    //var param='0106672141512d32363939';
    this.getInfo(param,26401);
  },
   //获取信息
   getInfo(param,address){
    param=param+'0000'
    let bytes=util.Str2Bytes(param);
    var crcBuf=util.calculateCRC(bytes,bytes.length-2);
    bytes[bytes.length-2]=crcBuf[0];
    bytes[bytes.length-1]=crcBuf[1];
    let buffer= new Int8Array(bytes).buffer;//array转arraybuffer-------------
    console.log(buffer);
    log.info('发送蓝牙信息指令'+param);
    //util.startNotice(buffer);
    this.getBLEDeviceCharacteristics(app.globalData.bluetoothInfo.deviceId, app.globalData.bluetoothInfo.serviceId, buffer,0,address) 
  },
  //解析蓝牙信息
  processBluetooth(receiveData1){
    receiveData1=receiveData1.substr(0,10*4+6+4);
    log.info('蓝牙信息返回信息'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      log.info('解析蓝牙信息CRC校验错误');
      return ;
    } else {
      let start=6;
      let bluetoothName=util.hexCharCodeToStr(receiveData1.substr(start,36));
      console.log('*****bluetoothName',bluetoothName);
      log.info('*****bluetoothName'+bluetoothName);
      let versionNo=bluetoothName.split('-')[1].trim();
      console.log('*****versionNo',versionNo);
      app.globalData.versionNo=versionNo;
      this.setData({
        versionNo : app.globalData.versionNo
      })
    }
  },

  //获取特征值到写数据和监听等流程
  getBLEDeviceCharacteristics(deviceId, serviceId, buffer, from, address) {
    var that=this;
    serviceId='0EF85A60-1DFC-11E6-8EC4-0002A5D5C51B'
    //serviceId=app.globalData.bluetoothInfo.serviceId;
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
                    console.log('message发送成功');
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
      //characteristicId: app.globalData.bluetoothInfo.characteristicId,
      success: function (res) {
        console.log('读取数据成功')
        wx.onBLECharacteristicValueChange((characteristic) => {
          console.info('**********开启监听',index);
          // this.setData(data)
          console.log('接收到数据源码：',characteristic.value);
          let dataRe=that.ab2hex(characteristic.value);
          console.log('接收到数据16进制：',dataRe);
          if(address===26401){
            that.setData({
              receivebluetooth:that.data.receivebluetooth.concat(dataRe)
            })
          }

         // console.log('接收到数据16进制++：',that.data.receiveDatas);
          index++;
          if(address===26401 && index>3){//蓝牙
            that.processBluetooth(that.data.receivebluetooth);
          }else{
            that.readBLECharacteristicValue(index,address);
          }
            
        })
      }
    })
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
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.getBluetoothInfo();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
   util.onBLEConnectionState();
  
   // }
    // if(!app.globalData.checkOpenIdValidation){
    //   wx.showModal({
    //     title: '当前用户无权限',
    //     showCancel: false,
    //     success (res) {
    //       // wx.navigateBack({
    //       //   delta: 1,
    //       // })
    //       wx.reLaunch({
    //         url: '../login/login',
    //       })
    //     }
    //   })
    // }
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

  }
})