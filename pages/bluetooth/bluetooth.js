const app = getApp()
const log = require('../../log.js')

function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

Page({
  data: {
    devices: [],
    connected: false,
    chs: [],
    versionNo: app.globalData.versionNo,
  },
  //跳转用户信息页面
  toUserinfo(){
    console.info("跳转到用户信息页面");
    wx.redirectTo({
      url: '../userInfo/userInfo',
    })
    
  },
  //搜索蓝牙
  openBluetoothAdapter() {
    var _this=this;
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        console.log('openBluetoothAdapter fail', res.errCode)
        if (res.errCode === 10000) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              _this.startBluetoothDevicesDiscovery()
            }
          })
        }else{
          //如果手机上的蓝牙没有打开，可以提醒用户
          wx.showModal({
            title: '请开启蓝牙和GPS',
            showCancel: false,
            confirmText: '确定',
            complete:function(){
              wx.navigateBack();
            }
          })
        }
      }
    })
  },
  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        if (res.discovering) {
          this.onBluetoothDeviceFound()
        } else if (res.available) {
          this.startBluetoothDevicesDiscovery()
        }
      }
    })
  },
  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        this.setData(data)
      })
    })
  },
  createBLEConnection(e) {
    const ds = e.currentTarget.dataset
    const deviceId = ds.deviceId
    const name = ds.name
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.setData({
          connected: true,
          name,
          deviceId,
        })
        console.log('已和设备建立连接',deviceId);
        //设置最大发送字节量
        wx.setBLEMTU({
          deviceId: deviceId,
          mtu: 20,
          success: (res1) => {
            console.log('设置最大发送字节量成功');
            //this.getBLEDeviceServices(deviceId) 
          },
          fail: (res1)=>{
            console.log('设置最大发送字节量失败');
          }
        })
        this.getBLEDeviceServices(deviceId) 
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  closeBLEConnection() {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId
    })
    this.setData({
      connected: false,
      chs: [],
      canWrite: false,
    })
  },
  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {
            this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
          }
        }
        // wx.navigateTo({
        //   url: '../importTankTable/importTankTable',
        // });
      }
    })
  },
  goBackPage(){
    console.log('获取蓝牙设备属性后点击返回上级页面');
   // wx.navigateBack()
   wx.redirectTo({
     url: '../mainPage/mainPage',
   })
    
  },
  getBLEDeviceCharacteristics(deviceId, serviceId) {
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
            // wx.readBLECharacteristicValue({
            //   deviceId,
            //   serviceId,
            //   characteristicId: item.uuid,
            // })
          }
          if (item.properties.write) {
            this.setData({
              canWrite: true
            })
  //          console.log('可写',this.data);
          }
      //      if ((item.properties.notify || item.properties.indicate) && item.properties.write && item.properties.read) {
          if (item.properties.write) {
            console.log('开启 notify ');
            log.info('开启 notify,deviceId:'+deviceId+',serviceId:'+serviceId);
            this._deviceId = deviceId
            //this._serviceId = serviceId
            //this._serviceId = 'EF85A60-1DFC-11E6-8EC4-0002A5D5C51B'
            this._serviceId = '0ef85a60-1dfc-11e6-8ec4-0002a5d5c51b'
            //this._characteristicId = item.uuid
            //this._characteristicId = 'EF85A6F-1DFC-11E6-8EC4-0002A5D5C51B'
            this._characteristicId = '0ef85a6f-1dfc-11e6-8ec4-0002a5d5c51b'
            this.setBLECharacteristicValue()
            // wx.notifyBLECharacteristicValueChange({
            //   deviceId,
            //   serviceId,
            //   characteristicId: item.uuid,
            //   state: true,
            //   success (res) {
            //     console.log('notifyBLECharacteristicValueChange success', res.errMsg)
            //   }
            // })
          }

        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
    // 操作之前先监听，保证第一时间获取数据
    // wx.onBLECharacteristicValueChange((characteristic) => {
    //   const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
    //   const data = {}
    //   if (idx === -1) {
    //     data[`chs[${this.data.chs.length}]`] = {
    //       uuid: characteristic.characteristicId,
    //       value: ab2hex(characteristic.value)
    //     }
    //   } else {
    //     data[`chs[${idx}]`] = {
    //       uuid: characteristic.characteristicId,
    //       value: ab2hex(characteristic.value)
    //     }
    //   }
    //   // data[`chs[${this.data.chs.length}]`] = {
    //   //   uuid: characteristic.characteristicId,
    //   //   value: ab2hex(characteristic.value)
    //   // }
    //   this.setData(data)
    //   console.log('接收到数据：',data);
    // })
  },
  setBLECharacteristicValue() {
    // 向蓝牙设备发送一个0x00的16进制数据
    let buffer = new ArrayBuffer(1)
    let dataView = new DataView(buffer)
    dataView.setUint8(0, 10)
    //设置全局变量，以便其他页面调用发送
    app.globalData.bluetoothInfo.deviceId=this._deviceId;
    app.globalData.bluetoothInfo.serviceId=this._serviceId;
    app.globalData.bluetoothInfo.characteristicId=this._characteristicId;
    console.log('最终设置的特征值',app.globalData.bluetoothInfo)
    log.info('最终设置的特征值'+app.globalData.bluetoothInfo.serviceId+','+app.globalData.bluetoothInfo.characteristicId)
    // wx.writeBLECharacteristicValue({
    //   deviceId: this._deviceId,
    //   serviceId: this._serviceId,
    //   characteristicId: this._characteristicId,
    //   value: buffer,
    // })
  },
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },

})
