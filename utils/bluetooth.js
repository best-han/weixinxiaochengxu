const app = getApp();

// 1.判断用户手机蓝牙和GPS是否打开
const bluetooth = inputValue => {
  console.info(inputValue)
  BluetoothDetail.inputValue=inputValue
  wx.openBluetoothAdapter({//调用微信小程序api 打开蓝牙适配器接口
    success: function (res) {
      wx.showToast({
        title: '初始化成功',
        icon: 'success',
        duration: 800
      })
      findBlue();//2.0
    },
    fail: function (res) {//如果手机上的蓝牙没有打开，可以提醒用户
      wx.showModal({
        title: '请开启蓝牙和GPS',
        showCancel: false,
        confirmText: '确定',
        complete:function(){
          wx.navigateBack();
        }
      })
    }
  })
}
//2.搜索附近蓝牙设备
const findBlue = () => {
  wx.startBluetoothDevicesDiscovery({
    allowDuplicatesKey: false,
    interval: 0,
    success: function (res) {
      wx.showLoading({
        title: '正在搜索设备',
      })
      getBlue()//3.0
    },
    fail: function () {
      console.log("关闭蓝牙搜索")
      wx.stopBluetoothDevicesDiscovery({
        success: (res) => {
          wx.navigateBack();
        },
      })
    }
  })
}

//3.获取蓝牙设备信息
const getBlue = () => {
  console.log("getBlue")
  var deviceList=new Array();
  wx.getBluetoothDevices({
    success: function (res) {
      wx.hideLoading();
      console.log('搜索完毕')
      console.log(res)
      console.log(res.devices)
      if (res.devices.length>0){
        for (var i = 0; i < res.devices.length; i++) {
          console.log('设备有'+res.devices[i])
          deviceList[i]=res.devices[i].name+' ('+res.devices[i].deviceId+')';
        /*  if (res.devices[i].deviceId == BluetoothDetail.inputValue ||
              res.devices[i].localName == BluetoothDetail.inputValue) {
            BluetoothDetail.deviceId = res.devices[i].deviceId
            connetBlue();//4.0
            break
             */
          }
          //展示蓝牙列表
          wx.showActionSheet({
            itemList: deviceList,
            success: function(resp) {
              console.log(resp)
               //var deviceIddd=resp.tapIndex.split(' (')[1];
                console.log(res.devices[resp.tapIndex].deviceId)
               
                BluetoothDetail.deviceId = res.devices[resp.tapIndex].deviceId
                connetBlue();//4.0

            },
            fail: function(resp) {
                console.log('连接失败,返回上一页')
                wx.stopBluetoothDevicesDiscovery({
                  success: (res) => {
                    wx.navigateBack();
                  },
                })
            }
          })
      }else{
        //console.log("继续搜索蓝牙设备")
        wx.showModal({
          title: '无可用蓝牙设备',
          content: '可能是您的GPS没有打开，请退出程序后打开GPS重试',
          showCancel: false,
          confirmText: '确定',
          complete:function(){
            wx.navigateBack();
            //findBlue()
          }
        })
        
      }
    },
    fail: function () {
      console.log("搜索蓝牙设备失败")
      wx.stopBluetoothDevicesDiscovery({
        success: (res) => {
          wx.navigateBack();
        },
      })
    },
    
  })
}
//4.通过蓝牙设备的id进行蓝牙连接
const connetBlue = () => {
  console.log('4.通过蓝牙设备的id进行蓝牙连接')
  wx.createBLEConnection({
    deviceId: BluetoothDetail.deviceId,//设备id
    success: function (res) {
      console.log('连接成功')
      wx.showToast({
        title: '连接成功',
        icon: 'fails',
        duration: 800
      })
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log('连接蓝牙成功之后关闭蓝牙搜索')
        }
      })
      getServiceId()//5.0
    },
    fail: function(res){
      console.log('连接蓝牙失败之后关闭蓝牙搜索',res)
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          
        }
      })
    }
  })
}
//5.获取服务的uuid
const getServiceId = () => {
  wx.getBLEDeviceServices({
    // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
    deviceId: BluetoothDetail.deviceId,
    success: function (res) {
      var model = res.services[0]
      BluetoothDetail.services=model.uuid
      console.log("services: " + BluetoothDetail.services);
      getCharacteId()//6.0
    }
  })
}
//6.判断蓝牙设备的特性值
const getCharacteId = () => {
  wx.getBLEDeviceCharacteristics({
    deviceId: BluetoothDetail.deviceId,
    serviceId: BluetoothDetail.services,
    success: function (res) {
      for (var i = 0; i < res.characteristics.length; i++) {//2个值
        var model = res.characteristics[i]
        if (model.properties.notify == true) {
          BluetoothDetail.notifyId= model.uuid//监听的值
          console.log("notifyId: " + BluetoothDetail.notifyId)
          startNotice(BluetoothDetail.notifyId)//7.0
        }
        if (model.properties.write == true) {
            BluetoothDetail.writeId=model.uuid//用来写入的值
          console.log("writeId: " + BluetoothDetail.writeId)
        }
      }
    }
  })
}
//7.notify
const startNotice = buffer => {
  wx.notifyBLECharacteristicValueChange({
    state: true, // 启用 notify 功能
    deviceId: app.globalData.bluetoothInfo.deviceId,
    serviceId: app.globalData.bluetoothInfo.serviceId,
    characteristicId: app.globalData.bluetoothInfo.characteristicId,  //第一步 开启监听 notityid  第二步发送指令 write
    success: function (res) {
      //var str1 = 'CAFB4AC988966A6aasf0705B1F9' //想写入的16进制的16位的字符串

      //sendMy(string2buffer(str1))

      //util.writeOnebyOne(buffer);
    }
  })
}
// 8.写入蓝牙设备 内容获取token
const sendMy = buffer => {
  wx.writeBLECharacteristicValue({
    deviceId: BluetoothDetail.deviceId,
    serviceId: BluetoothDetail.services,
    characteristicId: BluetoothDetail.writeId,//第二步写入的特征值
    value: buffer,
    success: function (res) {
      console.log("写入成功")
      wx.onBLECharacteristicValueChange(function (characteristic) {
        BluetoothDetail.returnValue=ab2hex(characteristic.value)//用来写入的值
        console.log("returnValue:  "+BluetoothDetail.returnValue)
        var param = {
          str: BluetoothDetail.returnValue
        }
        mutaul(param)
      })
    },
    fail: function () {
      console.log('写入失败')
    },
  })
}
// 与后端交互获取密码
const mutaul = param => {
  util.postJson({
    url: 'http://192.168.0.105:8089/api/device/encrypt',
    data: { ...param },
    success: function (resp) {
      console.log("发送给后端成功")
      pwd(string2buffer(resp.msg))
    },
    fail: function () {
      console.log('发送给后端失败')
    },
  })
}
// 密码发送
const pwd = buffer => {
  wx.writeBLECharacteristicValue({
    deviceId: BluetoothDetail.deviceId,
    serviceId: BluetoothDetail.services,
    characteristicId: BluetoothDetail.writeId,//第二步写入的特征值
    value: buffer,
    success: function (res) {
      console.log("写入成功")
      wx.onBLECharacteristicValueChange(function (characteristic) {
        BluetoothDetail.returnValue2=ab2hex(characteristic.value)//用来写入的值
        console.log("returnValue2:  "+BluetoothDetail.returnValue2)
      })
    },
    fail: function () {
      console.log('写入失败')
    },
  })
}
// 将字符串转换成ArrayBufer
const string2buffer = str => {
  let val = ""
  if (!str) return;
  let length = str.length;
  let index = 0;
  let array = []
  while (index < length) {
    array.push(str.substring(index, index + 2));
    index = index + 2;
  }
  val = array.join(",");
  // 将16进制转化为ArrayBuffer
  return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16)
  })).buffer
}
const ab2hex = buffer => {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}
module.exports = { 
  bluetooth: bluetooth,
  startNotice: startNotice
  };
