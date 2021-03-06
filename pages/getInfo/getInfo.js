// pages/tankStorage/tankStorage.js
const app=getApp();
var util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tankdatas:[],
    devices: [],
    connected: false,
    chs: [],
    receiveDatas:''
  },
   //下发读取实时罐存
   nowData(){
    var that=this;
    //Modbus request 03 (read holding register) on address 12070 (0x2F26) for 25 registers (0x19) (2 bytesfor 1 register)    01032F2600196D1F 
    var param='01032F2600196D1F';
    var buffer=util.string2buffer(param);
    console.log(buffer);
    //util.startNotice(buffer);
    this.getBLEDeviceCharacteristics(app.globalData.bluetoothInfo.deviceId, app.globalData.bluetoothInfo.serviceId, buffer,0) 
  },

  //读取到蓝牙的数据解析填充到页面
  showTankdatas(ss){
    var buf=util.readBLECharacteristicValue();
    if(ss==0){//实时罐存
      this.processInventroyNow(buf)
    }else{
      this.processYKInventroy(buf);
    } 
  },
  //清空
  cleanData(){
    this.setData({
      tankdatas: []
    });
  },
  //解析实时罐存
  processInventroyNow(receiveData1) {
    var receiveData=new Int8Array(receiveData1);
    if (!util.CheckCRC(receiveData)) {
		  console.log("CRC校验错误"); // CRC校验错误
			return ;
		} else {
      var timeByte = new Int8Array(7); // 时间数据
			for (var i = 0; i < timeByte.length; i++) {
				timeByte[i] = receiveData[i + 3];
			}
			var time = this.byte2Date(timeByte);
      var tankCount = receiveData[2];// 油罐数
      var tankdata;
      var da=[tankCount];
			for (var i = 0; i < tankCount; i++) {
				var offset = i * 31;
        var time=time;
				var tankIDByte = receiveData[offset + 10]; // 油罐编号
        var tankNo=tankIDByte < 0 ? tankIDByte + 256: tankIDByte;
				var oilIDByte = receiveData[offset + 11]; // 油品编号
        var oilCode=oilIDByte < 0 ? oilIDByte + 256 : oilIDByte;
        var oilVTByte = receiveData1.slice(offset + 13,offset + 17);
         // 油体积
        var vt=this.abConvertFloat(oilVTByte);
        var oilStandsrdVByte=receiveData1.slice(offset + 17,offset + 21);
        var v20=this.abConvertFloat(oilStandsrdVByte);
        var emptyVByte=receiveData1.slice(offset + 21,offset + 25);
        var empty=this.abConvertFloat(emptyVByte);
        // 油高
        var oilLevelByte= receiveData1.slice(offset + 25,offset + 29);
        var oilHeight=this.abConvertFloat(oilLevelByte);
        // 水高
        var waterLevelByte= receiveData1.slice(offset + 29,offset + 33);
        var waterHeight=this.abConvertFloat(waterLevelByte);
        // 温度
        var temputerByte= receiveData1.slice(offset + 33,offset + 37);
        var temperature=this.abConvertFloat(temputerByte);
        // 水体积
        var waterVByte= receiveData1.slice(offset + 37,offset + 41);
        var waterVol=this.convertFloat(waterVByte);
        var ta='油罐编号：'+tankNo+'# 油品编号：'+oilCode+' 油体积：'+vt+' 油标准体积：'+v20+' 空体积：'+empty+' 油高：'+oilHeight+' 水高：'+waterHeight+' 温度：'+temperature+' 水体积：'+waterVol+' 时间：'+time;
        da[i]={name:ta};
      }
      da[da.length]={name:'\n'};
      this.setData({
        tankdatas: this.data.tankdatas.concat(da)
      })
    }
  },
    //解析盈科罐存
    processYKInventroy(receiveData1) {

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
  // 字符串转为ArrayBuffer对象，参数为字符串
  str2ArrayBuffer(str, len) {
    var buf = new ArrayBuffer(len);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = parseInt(str.substr(i * 2, 2), 16);
    }
    return buf;
  },
  byte2Date(data) {
		if (data.length != 7)
			return ;
		var time = this.checkByte(data);
		var year = time[0] * 256 + time[1];
		var month = time[2];
		var day = time[3];
		var hour = time[4];
		var minute = time[5];
    var second = time[6];
    return year+'-'+this.p(month)+'-'+this.p(day)+' '+this.p(hour)+':'+this.p(minute)+':'+this.p(second);
  },
  //时间补0
  p(s) {
    return s < 10 ? '0' + s : s
  },

  checkByte( data) {
		var ret = new Array(data.length);
		for (var i = 0; i < data.length; i++) {
      ret[i] = data[i] < 0 ? data[i] + 256 : data[i];
		}
		return ret;
	},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if(util.checkOpenIdValidation()){
      let state=util.onBLEConnectionState();
      if(!state){
        console.info('跳转蓝牙链接页面')
        wx.showModal({
          title: '当前蓝牙未连接,跳转蓝牙设备选择配对页面',
          showCancel: false,
          success (res) {
            wx.redirectTo({
              url: '../bluetooth/bluetooth',
            })
            
          }
        })
      }  
    }
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
  getBLEDeviceCharacteristics(deviceId, serviceId, buffer, from) {
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
                    wx.showModal({
                      title: '数据发送成功',
                      content: ''
                    })
                    that.readBLECharacteristicValue(2)
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
  readBLECharacteristicValue(index){
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
          that.setData({
            receiveDatas:that.data.receiveDatas.concat(dataRe)
          })
          console.log('接收到数据16进制++：',that.data.receiveDatas);
          index++;
          if(index<10){
            that.readBLECharacteristicValue(index);
          }
        })
      }
    })
 },
  //写命令
  writeBLECharacteristicValue(buffer,characteristicId) {
    wx.writeBLECharacteristicValue({
      deviceId: this._deviceId,
      serviceId: this._serviceId,
      characteristicId: characteristicId,
      value: buffer,
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