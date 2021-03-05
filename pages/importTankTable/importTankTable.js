// pages/importTankTable/importTankTable.js
const app=getApp();
var util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bluetoothArray: [],
    index: 0,
    files: [],
    devices: [],
    connected: false,
    chs: [],
    
  },
  //点击选择文件
  chooseFile: function(){
    var that = this;
    wx.chooseMessageFile({
      count: 10,//最大允许选择10个文件
      type: 'file',
      success (res) {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFiles = res.tempFiles;
        var filetype;
        var name;
        for(var i=0; i<tempFiles.length; i++){
          //type=tempFiles[i].type;//文件类型 都是file
          name=tempFiles[i].name;//文件名称
          filetype=name.split('.')[1];
          console.log(filetype);
          if(!(filetype=='txt' || filetype=='xls' || filetype=='xlsx')  ){
            wx.showModal({
              title: '文件类型错误',
              showCancel: false,
              confirmText: '确定',
              complete:function(){
                return;
              }
            })
            return;
          }
        }
        that.setData({
          files: tempFiles
        })
      }
    })
  },
  //导入
  importTankTableFiles(){
    var that=this;
    var tempFiles=this.data.files;
    for(var i=0; i<tempFiles.length; i++){
      var filePath=tempFiles[i].path;
      var name=tempFiles[i].name;//文件名称
      
      console.log('所选的文件的路径为：'+filePath);
      //this.readFiless(filePath);
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        //encoding:'hex',//默认 ArrayBuffer 格式读取文件的二进制内容
        success: res => {
          //返回临时文件路径
          //console.log(res.data)
          let buffer=that.tankTableMsg(filePath,name,res.data);

          //util.startNotice(buffer);
          //util.writeOnebyOne(buffer);
          that.getBLEDeviceCharacteristics(app.globalData.bluetoothInfo.deviceId, app.globalData.bluetoothInfo.serviceId, buffer) 
        },
        fail: console.error
      })
    }
    
  },
  //下发容积表指令
  tankTableMsg(filePath,name,data){
    var tankNo=name.split('.')[0];
    // if(tankNo.length==1){
    //   tankNo='0'+tankNo;
    // }
    var buffer=new Array();
    buffer[0]=0x01;
    buffer[1]=0x10;
    buffer[2]=0x01;
    buffer[3]=0x05;
    buffer[4]=0x00;//数量
    buffer[5]=0x00;
    buffer[6]=util.intTO2Bytes(tankNo)[1];
    buffer[7]=0x30;
    buffer[8]=0x30;
    buffer[9]=0x30;
    buffer[10]=0x30;
    buffer[11]=0x30;
    buffer[12]=0x30;
    buffer[13]=0x30;
    buffer[14]=0x30;
    buffer[15]=0x00;
    buffer[16]=0x00;
    buffer[17]=0x00;
    buffer[18]=0x00;
    buffer[19]=0x00;
    buffer[20]=0x00;
    buffer[21]=0x00;
    buffer[22]=0x00;
    buffer[23]=0x00;//2字节当前下发起始序号。默认：00 00
    buffer[24]=0x00;
    var hv=util.ab2str(data);
 //   console.log(hv);
    //以空格分隔 高度 体积
    var hvs = hv.trim().split(/\s+/);
    console.log(hvs.length);
    var hs=hvs.length/2;
    var hsbuf=util.intTO2Bytes(hs);
    buffer[25]=hsbuf[0];//2字节当前下发行数
    buffer[26]=hsbuf[1];
    buffer[27]=hsbuf[0];//2字节总行数
    buffer[28]=hsbuf[1];
    //var buffer='011001050000'+tankNo+'30303030303030300000000000000000 0000 0000';
    var index=0;
    for (var j = 0; j < hvs.length; j+=2) {
      //var table = hvs[j];
      var height = parseInt(hvs[j]);
      var vol = parseFloat(hvs[j+1]);
      //验证容积表数据正确性
      if ((j + 2) < hvs.length) {//下一行得高度和体积比上一个得大
          var heightNext = hvs[j + 2];//下一行得高度和体积
          var volNext = hvs[j + 3];
          if (height > parseInt(heightNext) || vol > parseFloat(volNext)) {
              console.error("容积表下一行的高度和体积比上一个的大-" + height + ":" + vol);
              return false;
          }
      }
      var heightBuf=util.intTO2Bytes(height);
      var volBuf=util.intTO4Bytes(vol);
      buffer[28+(++index)]=heightBuf[0];
      buffer[28+(++index)]=heightBuf[1];
      buffer[28+(++index)]=volBuf[0];
      buffer[28+(++index)]=volBuf[1];
      buffer[28+(++index)]=volBuf[0];
      buffer[28+(++index)]=volBuf[1];
    }
    //数量
    var dataNum=util.intTO2Bytes(buffer.length-6);
    console.log('----------------数量',buffer.length,dataNum);
    buffer[4]=dataNum[0];
    buffer[5]=dataNum[1];
    var serialNumber = (new Date()).getTime().toString().substring(5);
    var serialNumberBuf=util.intTO4Bytes(parseInt(serialNumber));
    buffer[28+(++index)]=serialNumberBuf[0];
    buffer[28+(++index)]=serialNumberBuf[1];
    buffer[28+(++index)]=serialNumberBuf[2];
    buffer[28+(++index)]=serialNumberBuf[3];

    buffer[28+(++index)]=0x00;
    buffer[28+(++index)]=0x00;
    var crcBuf=util.calculateCRC(buffer,buffer.length-2);
    buffer[buffer.length-2]=crcBuf[0];
    buffer[buffer.length-1]=crcBuf[1];
    console.log('下发溶剂表命令为',buffer);
    return buffer;
  },
  //下发容积表后返回解析
  processTankTableAck(receiveData1){
    var receiveData=new Int8Array(receiveData1);
    console.log('解析下发容积表后的指令');
    if(util.CheckCRC(receiveData) && buf.length==8){
      return true;
    }
    return false;
  },

  //读文件
  readFiless(filePath){
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      //encoding:'utf-8',//默认 ArrayBuffer 格式读取文件的二进制内容
      success: res => {
        //返回临时文件路径
        console.log(res.data)
        return res.data;
      
      },
      fail: console.error
    })
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
            wx.navigateTo({
              url: '../bluetooth/bluetooth',
            })
          }
        })
      }  
    }
    
  },

  /**
  *array：普通选择器下拉的数据
  *index：默认显示的时下标为0的数据
  */
 bindPickerChange: function (e) {
  console.log('picker下拉项发生变化后，下标为：', e.detail.value)
  this.setData({
    index: e.detail.value
  })
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

  getBLEDeviceCharacteristics(deviceId, serviceId, buffer) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        console.log('获取特征值属性');
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {
            this.setData({
              canRead: true
            })
          }
          if (item.properties.write) {
            this.setData({
              canWrite: true
            })
            this._deviceId = deviceId
            this._serviceId = serviceId
            this._characteristicId = item.uuid
            //防止循环下发
            if(buffer.length>0){
              util.writeOnebyOne(buffer);
              buffer=[];
            }
            
          }
          if ((item.properties.notify || item.properties.indicate) && item.properties.write && item.properties.read) {
            console.log('开启 notify ');
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
              success (res) {
                console.log('notifyBLECharacteristicValueChange success', res.errMsg)
              }
            })
          }

        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
    var retStr='';
    var buf=new ArrayBuffer();
    // 操作之前先监听，保证第一时间获取数据
    wx.onBLECharacteristicValueChange((characteristic) => {
     
      const idx = this.inArray(this.data.chs, 'uuid', characteristic.characteristicId)
      const data = {}
      if (idx === -1) {
        data[`chs[${this.data.chs.length}]`] = {
          uuid: characteristic.characteristicId,
          value: this.ab2hex(characteristic.value)
        }
        retStr+=this.ab2hex(characteristic.value)
        buf=this.mergeArrayBuffer(buf,characteristic.value);
      } else {
        data[`chs[${idx}]`] = {
          uuid: characteristic.characteristicId,
          value: this.ab2hex(characteristic.value)
        }
        retStr+=this.ab2hex(characteristic.value)
        buf=this.mergeArrayBuffer(buf,characteristic.value);
      }
      // data[`chs[${this.data.chs.length}]`] = {
      //   uuid: characteristic.characteristicId,
      //   value: ab2hex(characteristic.value)
      // }
      this.setData(data)
      console.log('接收到数据：',data);
    })
    var that=this;
    setTimeout(function(){
      console.log(retStr);
      //var buf=util.stringToBytes(retStr);
      console.log(buf);
      that.processTankTableAck(buf);
    },2000);
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


  getBLEDeviceCharacteristics22(deviceId, serviceId, buffer) {
    let _this=this;
    wx.getBLEDeviceCharacteristics({
      deviceId: deviceId,
      serviceId: serviceId,
      success: function (res) {
        console.log(res.characteristics)
        let deviceCharacteristics = res.characteristics
        for (var i = 0; i < deviceCharacteristics.length; i++) {
          let characteristic = deviceCharacteristics[i]
          let characteristicProperties = characteristic.properties
          if (characteristicProperties.notify === true) {
            let characteristicId = characteristic.uuid
            wx.notifyBLECharacteristicValueChange({
              state: true, // 启用 notify 功能
              deviceId: deviceId,
              serviceId: serviceId,
              characteristicId: characteristicId,
              success: function (res) {
                console.log('开启notify成功' + characteristicId)
                // for (let i = 0; i < dataView.byteLength; i++) {
                //   var writeData = '0x' + dataView.getUint8(i).toString(16)
                //   that.writeDatas = that.writeDatas + '\n' + writeData
                // }
               // if (characteristicProperties.read) {
                  _this.setData({
                    canRead: true
                  })
                //}
               // if (characteristicProperties.write) {
                  _this.setData({
                    canWrite: true
                  })
                //   this._deviceId = deviceId
                //   this._serviceId = serviceId
                //   this._characteristicId = item.uuid
                //   //防止循环下发
                //   if(buffer.length>0){
                //     util.writeOnebyOne(buffer);
                //     buffer=[];
                //   }
                  
                // }

                //防止循环下发
                if(buffer.length>0){
                  util.writeOnebyOne(buffer);
                  console.log('写入结束');
                  buffer=[];
                }
                
                // wx.writeBLECharacteristicValue({
                //   deviceId: that.deviceId,
                //   serviceId: that.serviceId,
                //   characteristicId: that.characteristicId,
                //   value: dataBuffer,
                //   success: function (res) {
                //     console.log('发送的数据：' + that.writeDatas)
                //     console.log('message发送成功')
                //     wx.showModal({
                //       title: '数据发送成功',
                //       content: that.writeDatas
                //     })
                //     wx.readBLECharacteristicValue({
                //       deviceId: that.deviceId,
                //       serviceId: that.serviceId,
                //       characteristicId: that.characteristicId,
                //       success: function (res) {
                //         console.log('读取数据成功')
                //       }
                //     })
                //   },
                //   fail: function (res) {
                //     // fail
                //     console.log('message发送失败' + that.characteristicIdw)
                //     wx.showToast({
                //       title: '数据发送失败，请稍后重试',
                //       icon: 'none'
                //     })
                //   },
                //   complete: function (res) {
                //     // fail
                //     console.log('message发送完成')
                //   }
                // })
                wx.readBLECharacteristicValue({
                  deviceId: deviceId,
                  serviceId: serviceId,
                  characteristicId: characteristicId,
                  success: function success(res) {
                    console.log('开启读');
                  }
                });
                wx.onBLECharacteristicValueChange(function (res) {
                  console.log('接收数据:', _this.ab2hex(res.value));
                  var recMessage = _this.ab2hex(res.value);
                  
                  //that.reMessage.push(recMessage);
                });
              },
              fail: function () {
                console.log('开启notify失败' + characteristicId)
              }
            })
            // that.writeMessage(that.deviceId, that.serviceId, that.characteristicIdw, that.characteristicIdr, that.characteristicIdn)
          }
        }
      },
      fail: function () {
        console.log('获取characteristic失败')
      }
    })
  },


  receiveMessage: function receiveMessage() {
    var that = this;
    let deviceId = app.globalData.bluetoothInfo.deviceId;
    let serviceId = app.globalData.bluetoothInfo.serviceId;
    wx.getBLEDeviceCharacteristics({
      deviceId: deviceId,
      serviceId: serviceId,
      success: function success(res) {
        console.log(res.characteristics);
        let deviceCharacteristics = res.characteristics;
        for (var i = 0; i < deviceCharacteristics.length; i++) {
          let characteristic = deviceCharacteristics[i];
          let characteristicProperties = characteristic.properties;
          if (characteristicProperties.notify === true) {
            let characteristicId = characteristic.uuid;
            wx.notifyBLECharacteristicValueChange({
              state: true, // 启用 notify 功能
              deviceId: deviceId,
              serviceId: serviceId,
              characteristicId: characteristicId,
              success: function success(res) {
                console.log('开启notify成功' + characteristic.uuid);
                console.log(characteristicProperties.write);
                console.log(characteristicProperties.read);
                wx.readBLECharacteristicValue({
                  deviceId: deviceId,
                  serviceId: serviceId,
                  characteristicId: characteristicId,
                  success: function success(res) {
                    console.log('接收数据成功');
                  }
                });
                wx.onBLECharacteristicValueChange(function (res) {
                  console.log('接收数据:', that.ab2hex(res.value));
                  var recMessage = that.ab2hex(res.value);

                  //that.reMessage.push(recMessage);
                });
              },
              fail: function fail() {
                console.log('开启notify失败' + characteristicId);
                console.log(characteristicProperties.write);
                console.log(characteristicProperties.read);
              },
              complete: function complete() {
                console.log('开启完成');
              }
            });
          }
        }
      },
      fail: function fail() {
        console.log('获取characteristic失败');
      }
    });
  },
  ab2hex: function ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
      return ('00' + bit.toString(16)).slice(-2);
    });
    return hexArr.join('');
  }

})