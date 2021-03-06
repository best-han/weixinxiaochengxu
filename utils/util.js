const app = getApp();
const log = require('../log.js')

//验证用户是否有权限
function checkOpenIdValidation(){
  //return true;//测试。。。。。。。。。。。。。。。。。。。。
  console.log('查看有无授权');
  if(!app.globalData.checkOpenIdValidation){
    wx.showModal({
      title: '无权限,请联系工作人员',
      showCancel: false,
      confirmText: '确定',
      complete:function(){
        //return false;
        wx.reLaunch({
          url: '../login/login',
        })
      }
    })
  }else{
    return true;
  }
  return false;
  
}

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}
//读取低功耗蓝牙设备的特征值的二进制数据值。注意：必须设备的特征值支持 read 才可以成功调用。
function readBLECharacteristicValue(){

  var str;
  return wx.readBLECharacteristicValue({
    deviceId: app.globalData.bluetoothInfo.deviceId,
    serviceId: app.globalData.bluetoothInfo.serviceId,
    characteristicId: app.globalData.bluetoothInfo.characteristicId,
    success (res) {
      console.log('readBLECharacteristicValue:', res.errCode);
      let buf=res.errMsg;
      str=ab2str(buf);
      console.log(str);
      return buf;
    }
  })
}

//监听低功耗蓝牙连接状态
function onBLEConnectionState(){
  wx.onBLEConnectionStateChange(function(res) {
    // 该方法回调中可以用于处理连接意外断开等异常情况
    console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
    let state=res.connected;
      if(!state){
        console.info('跳转蓝牙链接页面')
        wx.showModal({
          title: '当前蓝牙未连接,跳转蓝牙设备选择配对页面',
          showCancel: false,
          success (res) {
            wx.redirectTo({
              url: '/pages/bluetooth/bluetooth',
            })
            // wx.navigateTo({
            //   url: '/pages/bluetooth/bluetooth',
            // })
          }
        })
      }  
  })
}
//ArrayBuffer转String
 function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
//string转ArrayBuffer
function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
function getStr(){
  return '01 10 01 05 05 3f 02 31 2e 37 30 30 30 30 30 00 00 00 00 00 00 00 00 00 00 00 dc 00 dc 00 0a 42 1c 00 00 00 14 42 a0 00 00 00 1e 42 fa 00 00 00 28 43 2c 00 00 00 32 43 5e 00 00 00 3c 43 89 80 00 00 46 43 a5 80 00 00 50 43 c2 80 00 00 5a 43 e0 80 00 00 64 44 00 40 00 00 6e 44 10 80 00 00 78 44 21 80 00 00 82 44 33 40 00 00 8c 44 45 80 00 00 96 44 58 40 00 00 a0 44 6b c0 00 00 aa 44 7f c0 00 00 b4 44 8a 20 00 00 be 44 94 a0 00 00 c8 44 9f 80 00 00 d2 44 aa 80 00 00 dc 44 b5 e0 00 00 e6 44 c1 60 00 00 f0 44 cd 40 00 00 fa 44 d9 40 00 01 04 44 e5 a0 00 01 0e 44 f2 20 00 01 18 44 fe e0 00 01 22 45 05 e0 00 01 2c 45 0c 80 00 01 36 45 13 30 00 01 40 45 1a 00 00 01 4a 45 20 e0 00 01 54 45 27 e0 00 01 5e 45 2f 00 00 01 68 45 36 30 00 01 72 45 3d 70 00 01 7c 45 44 d0 00 01 86 45 4c 30 00 01 90 45 53 b0 00 01 9a 45 5b 40 00 01 a4 45 62 e0 00 01 ae 45 6a a0 00 01 b8 45 72 60 00 01 c2 45 7a 30 00 01 cc 45 81 10 00 01 d6 45 85 08 00 01 e0 45 89 08 00 01 ea 45 8d 18 00 01 f4 45 91 28 00 01 fe 45 95 40 00 02 08 45 99 68 00 02 12 45 9d 90 00 02 1c 45 a1 c0 00 02 26 45 a5 f8 00 02 30 45 aa 38 00 02 3a 45 ae 80 00 02 44 45 b2 c8 00 02 4e 45 b7 20 00 02 58 45 bb 78 00 02 62 45 bf d8 00 02 6c 45 c4 40 00 02 76 45 c8 a8 00 02 80 45 cd 18 00 02 8a 45 d1 90 00 02 94 45 d6 10 00 02 9e 45 da 90 00 02 a8 45 df 18 00 02 b2 45 e3 a8 00 02 bc 45 e8 40 00 02 c6 45 ec d8 00 02 d0 45 f1 78 00 02 da 45 f6 18 00 02 e4 45 fa c8 00 02 ee 45 ff 78 00 02 f8 46 02 14 00 03 02 46 04 74 00 03 0c 46 06 d4 00 03 16 46 09 34 00 03 20 46 0b 9c 00 03 2a 46 0e 00 00 03 34 46 10 6c 00 03 3e 46 12 d8 00 03 48 46 15 44 00 03 52 46 17 b4 00 03 5c 46 1a 28 00 03 66 46 1c 9c 00 03 70 46 1f 10 00 03 7a 46 21 88 00 03 84 46 24 00 00 03 8e 46 26 78 00 03 98 46 28 f4 00 03 a2 46 2b 70 00 03 ac 46 2d ec 00 03 b6 46 30 6c 00 03 c0 46 32 ec 00 03 ca 46 35 6c 00 03 d4 46 37 ec 00 03 de 46 3a 70 00 03 e8 46 3c f4 00 03 f2 46 3f 78 00 03 fc 46 41 fc 00 04 06 46 44 80 00 04 10 46 47 08 00 04 1a 46 49 90 00 04 24 46 4c 14 00 04 2e 46 4e a0 00 04 38 46 51 28 00 04 42 46 53 b0 00 04 4c 46 56 3c 00 04 56 46 58 c4 00 04 60 46 5b 50 00 04 6a 46 5d dc 00 04 74 46 60 64 00 04 7e 46 62 f0 00 04 88 46 65 7c 00 04 92 46 68 08 00 04 9c 46 6a 94 00 04 a6 46 6d 20 00 04 b0 46 6f ac 00 04 ba 46 72 38 00 04 c4 46 74 c4 00 04 ce 46 77 50 00 04 d8 46 79 dc 00 04 e2 46 7c 68 00 04 ec 46 7e f0 00 04 f6 46 80 be 00 05 00 46 82 02 00 05 0a 46 83 46 00 05 14 46 84 8a 00 05 1e 46 85 ce 00 05 28 46 87 12 00 05 32 46 88 56 00 05 3c 46 89 98 00 05 46 46 8a da 00 05 50 46 8c 1c 00 05 5a 46 8d 5e 00 05 64 46 8e 9e 00 05 6e 46 8f de 00 05 78 46 91 1e 00 05 82 46 92 5e 00 05 8c 46 93 9c 00 05 96 46 94 da 00 05 a0 46 96 18 00 05 aa 46 97 56 00 05 b4 46 98 92 00 05 be 46 99 ce 00 05 c8 46 9b 0a 00 05 d2 46 9c 44 00 05 dc 46 9d 80 00 05 e6 46 9e b8 00 05 f0 46 9f f2 00 05 fa 46 a1 2a 00 06 04 46 a2 62 00 06 0e 46 a3 98 00 06 18 46 a4 ce 00 06 22 46 a6 02 00 06 2c 46 a7 36 00 06 36 46 a8 68 00 06 40 46 a9 9a 00 06 4a 46 aa ca 00 06 54 46 ab fa 00 06 5e 46 ad 28 00 06 68 46 ae 56 00 06 72 46 af 80 00 06 7c 46 b0 ac 00 06 86 46 b1 d4 00 06 90 46 b2 fc 00 06 9a 46 b4 22 00 06 a4 46 b5 46 00 06 ae 46 b6 6a 00 06 b8 46 b7 8c 00 06 c2 46 b8 ac 00 06 cc 46 b9 ca 00 06 d6 46 ba e8 00 06 e0 46 bc 04 00 06 ea 46 bd 1c 00 06 f4 46 be 34 00 06 fe 46 bf 4a 00 07 08 46 c0 60 00 07 12 46 c1 72 00 07 1c 46 c2 82 00 07 26 46 c3 90 00 07 30 46 c4 9e 00 07 3a 46 c5 a8 00 07 44 46 c6 b2 00 07 4e 46 c7 b8 00 07 58 46 c8 bc 00 07 62 46 c9 be 00 07 6c 46 ca be 00 07 76 46 cb bc 00 07 80 46 cc b8 00 07 8a 46 cd b0 00 07 94 46 ce a8 00 07 9e 46 cf 9c 00 07 a8 46 d0 8e 00 07 b2 46 d1 7c 00 07 bc 46 d2 6a 00 07 c6 46 d3 54 00 07 d0 46 d4 3c 00 07 da 46 d5 20 00 07 e4 46 d6 02 00 07 ee 46 d6 e2 00 07 f8 46 d7 be 00 08 02 46 d8 96 00 08 0c 46 d9 6e 00 08 16 46 da 42 00 08 20 46 db 12 00 08 2a 46 db de 00 08 34 46 dc aa 00 08 3e 46 dd 70 00 08 48 46 de 34 00 08 52 46 de f4 00 08 5c 46 df b2 00 08 66 46 e0 6a 00 08 70 46 e1 20 00 08 7a 46 e1 d4 00 08 84 46 e2 82 00 08 8e 46 e3 2e 00 08 98 46 e3 d4 00 8a 95'.replace(/\s+/g,'');
}
function getStr2(){
  return '01 10 01 05 05 3f 02 31 2e 37 30 30 30 30 30 00 00 00 00 00 00 00 00 00 00 00 dc 00 dc 00 0a 42 1c 00 00 46 e3 d4 00 8a 95'.replace(/\s+/g,'');
}
function toUint8ab(str){
  return new Uint8Array(str.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16)
  })).buffer
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
//开启监听  第一步 开启监听 notityid  第二步发送指令 write
const startNotice = buffer => {
  console.log('开启监听并发送',app.globalData.bluetoothInfo);
  wx.notifyBLECharacteristicValueChange({
    state: true, // 启用 notify 功能
    deviceId: app.globalData.bluetoothInfo.deviceId,
    serviceId: app.globalData.bluetoothInfo.serviceId,//蓝牙特征值对应服务的 uuid
    characteristicId: app.globalData.bluetoothInfo.characteristicId,  // 蓝牙特征值的 uuid
    success: function (res) {
      //var str1 = 'CAFB4AC988966A6aasf0705B1F9' //想写入的16进制的16位的字符串

      //sendMy(string2buffer(str1))
      console.log('开启监听成功');
      wx.onBLECharacteristicValueChange(function(res) {
        console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
        console.log('接收到数据：',ab2hex(res.value))
      })
      //writeOnebyOne(buffer);
    },
    fail(res){
      console.log('开启监听失败'),res.data;
    }
  })

}


//分一次20字节发送
function writeOnebyOne(value){
  //转成字符串，再转成16进制ArrayBuffer
 //  var valuestr=ab2str(value);
  //  console.log(valuestr);
  // valuestr=getStr2();//------------
 // let buffer2=stringToByte(valuestr);
  //console.log(buffer2);

  //var buffer  =buffer2 ;
  
  writeBLECharacteristicValue(value);

  console.log("导入结束");
}
//向低功耗蓝牙设备特征值中写入二进制数据。注意：必须设备的特征值支持 write 才可以成功调用
function writeBLECharacteristicValue(value) {

  console.log('当前写入时的特征值',app.globalData.bluetoothInfo);
  //let byteLen=value.length;//-----------------
  //let buffer= new Int8Array(value).buffer;//array转arraybuffer-------------
  let byteLen=getStr().length/2;//------------------ti
  let buffer=toUint8ab(getStr());//---------------------ti
  let limit=20;//限制每次发送字节数
  let pos=0;//开始位置
  let i=0;//发送次数（成功）
  let num=0;//单条发送失败次数
  writeBLECharacteristicValueImpl(buffer,byteLen,limit,pos,i,num,(new Date).getTime);
  // sleep(2);
}
//延迟
function sleep(delay) {
  var start = (new Date()).getTime();
  while((new Date()).getTime() - start < delay) {
      continue;
  }
}
function writeBLECharacteristicValueImpl(buffer,byteLen,limit,pos,i,num,time1){
  //sleep(2);
  var tempBuffer ;
  if(byteLen>0){
    if(byteLen > limit){
      tempBuffer = buffer.slice(pos, pos + limit);
    }else{
      tempBuffer = buffer.slice(pos, pos + byteLen);
    }
    wx.writeBLECharacteristicValue({
      deviceId: app.globalData.bluetoothInfo.deviceId,
      serviceId: app.globalData.bluetoothInfo.serviceId,
      characteristicId: app.globalData.bluetoothInfo.characteristicId,
      value: tempBuffer,//此处为ArrayBuffer，貌似传进来的就行
      success(res){
        i++;
        if(i==1){
          console.error('开始时间',(new Date).toLocaleTimeString());     //获取当前时间
        }
        var time2=(new Date).getTime();
        console.log(time2-time1);
        if((time2-time1)>300){
          console.error('超过300ms');
        }
        if (byteLen > limit) {
          //tempBuffer = buffer.slice(pos, pos + limit);
          var valuestr=ab2hex(tempBuffer);
          console.log("第", i, "次发送成功:", valuestr);
          pos += limit;
          byteLen -= limit;
          console.log('写入成功,接着下一段');
          console.log('byteLen',byteLen);
          writeBLECharacteristicValueImpl(buffer,byteLen,limit,pos,i,num,time2);
        } else {
          //tempBuffer = buffer.slice(pos, pos + byteLen);
          var valuestr=ab2hex(tempBuffer);
          console.log("第", i, "次发送成功(最后一次):", valuestr);
          console.error('结束时间',(new Date).toLocaleTimeString()); 
          pos += byteLen;
          byteLen -= byteLen;
          writeBLECharacteristicValueImpl(buffer,byteLen,byteLen,pos,i,num,time2);
        }
        // wx.readBLECharacteristicValue({
        //   deviceId: app.globalData.bluetoothInfo.deviceId,
        //   serviceId: app.globalData.bluetoothInfo.serviceId,
        //   characteristicId: app.globalData.bluetoothInfo.characteristicId,
        //   success: function (res) {
        //     console.log("第", i, '读取数据成功')
        //   }
        // })
      },
      fail(res){
        console.log('写入失败',res.errCode);
        if(num<20){
          console.log('再来一次',++num);

          writeBLECharacteristicValueImpl(buffer,byteLen,limit,pos,i,num,time1)
          //writeBLECharacteristicValueImpl(value,num);
        }
      }
    })
  }
  
}
//十六进制表示字符串转字符串
function hexCharCodeToStr(hexCharCodeStr) {
    var trimedStr = hexCharCodeStr.trim();
    var rawStr = 
      trimedStr.substr(0,2).toLowerCase() === "0x"
      ? 
      trimedStr.substr(2) 
      : 
      trimedStr;
    var len = rawStr.length;
    if(len % 2 !== 0) {
     alert("Illegal Format ASCII Code!");
        return "";
    }
    var curCharCode;
    var resultStr = [];
    for(var i = 0; i < len;i = i + 2) {
     curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
     resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join("");
}

//string转byte[]
function stringToBytes( str ) {  
  var ch, st, re = []; 
  for (var i = 0; i < str.length; i++ ) { 
      ch = str.charCodeAt(i);  // get char  
      st = [];                 // set up "stack"  
     do {  
          st.push( ch & 0xFF );  // push byte to stack  
          ch = ch >> 8;          // shift value down by 1 byte  
      }    
      while ( ch );  
      // add stack contents to result  
      // done because chars have "wrong" endianness  
      re = re.concat( st.reverse() ); 
  }  
  // return an array of bytes  
  return re;  
}
function CheckCRC(data) {
  var temp = calculateCRC(data, data.length - 2);
  console.log(data[data.length - 2]);
  //log.info(data[data.length - 2]);
  console.log(data[data.length - 1]);
  //log.info(data[data.length - 1]);
  let temp1=temp[0] <0 ? temp[0]+256:temp[0];
  let temp2=temp[1] <0 ? temp[1]+256:temp[1];
  console.log(temp1);
  //log.info(temp1);
  console.log(temp2);
  //log.info(temp2);
  if (temp1 != data[data.length - 2]) {
    log.info('crc校验不通过！！！');
    return false;
  }
  if (temp2 != data[data.length - 1]) {
    log.info('crc校验不通过！！！');
    return false;
  }
  return true;
}

function calculateCRC(input,  size) { // 返回的16位CRC为两字节高位在后,低字节在前
  var ret = new Int8Array(2);
  var crc;
  var i, j;
  var CRC16Lo = 0xff;
  var CRC16Hi = 0xff; // CRC register
  var cl = 0x01;
  var ch = 0xA0; // 0xA001
  var saveHi, saveLo;
  for (i = 0; i < size; i++) {
    CRC16Lo = CRC16Lo ^ input[i]; // 每一个数据与CRC寄存器进行异或
    CRC16Lo = CRC16Lo & 0xff;
    for (j = 0; j < 8; j++) {
      saveHi = CRC16Hi;
      saveLo = CRC16Lo;
      CRC16Hi = CRC16Hi >> 1; // 高位右移一位
      CRC16Lo = CRC16Lo >> 1; // 低位右移一位
      if ((saveHi & 0x1) == 1) // 如果高位字节最后一位为1
      {
        CRC16Lo = CRC16Lo | 0x80; // 则低位字节右移后前面补1
      }
      if ((saveLo & 0x1) == 1) // 如果LSB为1，则与多项式码进行异或
      {
        CRC16Hi = CRC16Hi ^ ch;
        CRC16Lo = CRC16Lo ^ cl;
      }
    }
  }
  ret[1] = (CRC16Hi & 0xff);
  ret[0] = (CRC16Lo & 0xff);
  return ret;
}
// 构建一个视图，把字节数组写到缓存中，索引从0开始，大端字节序
function getView(bytes) {
  var view = new DataView(new ArrayBuffer(bytes.length))
  for (var i = 0; i < bytes.length; i++) {
    view.setUint8(i, bytes[i])
  }
  return view
}
// 将字节数组转成有符号的8位整型，大端字节序
// eslint-disable-next-line no-unused-vars
function toInt8(bytes) {
  return getView(bytes).getInt8()
}
// 将字节数组转成无符号的8位整型，大端字节序
// eslint-disable-next-line no-unused-vars
function toUint8(bytes) {
  return getView(bytes).getUint8()
}
// 将字节数组转成有符号的16位整型，大端字节序
// eslint-disable-next-line no-unused-vars
function toInt16(bytes) {
  return getView(bytes).getInt16()
}
// 将字节数组转成无符号的16位整型，大端字节序
// eslint-disable-next-line no-unused-vars
function toUint16(bytes) {
  return getView(bytes).getUint16()
}
// 将字节数组转成有符号的32位整型，大端字节序
// eslint-disable-next-line no-unused-vars
function toInt32(bytes) {
  return getView(bytes).getInt32()
}
// 将字节数组转成无符号的32位整型，大端字节序
// eslint-disable-next-line no-unused-vars
function toUint32(bytes) {
  return getView(bytes).getUint32()
}
// 将字节数组转成32位浮点型，大端字节序
// eslint-disable-next-line no-unused-vars
function toFloat32(bytes) {
  return getView(bytes).getFloat32()
}
// 将字节数组转成64位浮点型，大端字节序
// eslint-disable-next-line no-unused-vars
function toFloat64(bytes) {
  return getView(bytes).getFloat64()
}

// 将数值写入到视图中，获得其字节数组，大端字节序
function getUint8Array(len, setNum) {
  var buffer = new ArrayBuffer(len) // 指定字节长度
  setNum(new DataView(buffer)) // 根据不同的类型调用不同的函数来写入数值
  return new Uint8Array(buffer) // 创建一个字节数组，从缓存中拿取数据
}
// 得到一个8位有符号整型的字节数组，大端字节序
// eslint-disable-next-line no-unused-vars
function getInt8Bytes(num) {
  return getUint8Array(1, function(view) { view.setInt8(0, num) })
}
// 得到一个8位无符号整型的字节数组，大端字节序
// eslint-disable-next-line no-unused-vars
function getUint8Bytes(num) {
  return getUint8Array(1, function(view) { view.setUint8(0, num) })
}
// 得到一个16位有符号整型的字节数组，大端字节序
// eslint-disable-next-line no-unused-vars
function getInt16Bytes(num) {
  return getUint8Array(2, function(view) { view.setInt16(0, num) })
}
// 得到一个16位无符号整型的字节数组，大端字节序
function getUint16Bytes(num) {
  return getUint8Array(2, function(view) { view.setUint16(0, num) })
}
// 得到一个32位有符号整型的字节数组，大端字节序
// eslint-disable-next-line no-unused-vars
function getInt32Bytes(num) {
  return getUint8Array(4, function(view) { view.setInt32(0, num) })
}
// 得到一个32位无符号整型的字节数组，大端字节序
function getUint32Bytes(num) {
  return getUint8Array(4, function(view) { view.setUint32(0, num) })
}
// 得到一个32位浮点型的字节数组，大端字节序
// eslint-disable-next-line no-unused-vars
function getFloat32Bytes(num) {
  return getUint8Array(4, function(view) { view.setFloat32(0, num) })
}
// 得到一个64位浮点型的字节数组，大端字节序
// eslint-disable-next-line no-unused-vars
function getFloat64Bytes(num) {
  return getUint8Array(8, function(view) { view.setFloat64(0, num) })
}

/**
 * int整数转为2字节 字节数组
 * @param intNum
 * @returns {unknown[]}
 */
function intTO2Bytes(intNum) {
  return Array.from(getUint16Bytes(intNum))
}

/**
 * int整数转为4字节 字节数组
 * @param intNum
 * @returns {unknown[]}
 */
function intTO4Bytes(intNum) {
  return Array.from(getUint32Bytes(intNum))
}

/**
 * 字节数组(4个字节)转int
 * @param bytes
 * @return {number}
 */
function bytes4ToInt(bytes) {
  return toUint32(bytes)
}

/**
 * 字节数组(2个字节)转int
 * @param bytes
 * @return {number}
 */
function bytes2ToInt(bytes) {
  return toUint16(bytes)
}

/**
 * 字节数组(1个字节)转int
 * @param bytes
 * @return {number}
 */
function bytesToInt(bytes) {
  return toUint8(bytes)
}
/**
 * 字节数组(4字节)转float(保留两位小数)
 * @param bytes
 * @return {number}
 */
function bytesToFloat(bytes) {
  return toFloat32(bytes)
}

/**
 * 单精度浮点数转字节数组
 * @param floatNum
 * @return {unknown[]}
 */
function floatTO4Bytes(floatNum) {
  return Array.from(getFloat32Bytes(floatNum))
}
/**
 * 字符串转字节数组（UTF编码）
 * @param str
 * @returns {[]}
 */
function stringToByte(str) {
  const bytes = []
  let c
  for (let i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    if (c >= 0x010000 && c <= 0x10FFFF) {
      bytes.push(((c >> 18) & 0x07) | 0xF0)
      bytes.push(((c >> 12) & 0x3F) | 0x80)
      bytes.push(((c >> 6) & 0x3F) | 0x80)
      bytes.push((c & 0x3F) | 0x80)
    } else if (c >= 0x000800 && c <= 0x00FFFF) {
      bytes.push(((c >> 12) & 0x0F) | 0xE0)
      bytes.push(((c >> 6) & 0x3F) | 0x80)
      bytes.push((c & 0x3F) | 0x80)
    } else if (c >= 0x000080 && c <= 0x0007FF) {
      bytes.push(((c >> 6) & 0x1F) | 0xC0)
      bytes.push((c & 0x3F) | 0x80)
    } else {
      bytes.push(c & 0xFF)
    }
  }
  return bytes
}

/**
 * 字节数组转字符串
 * @param arr
 * @return {string}
 */
function byteToString(arr) {
  if (typeof arr === 'string') {
    return arr
  }
  let str = ''
  const _arr = arr
  for (let i = 0; i < _arr.length; i++) {
    const one = _arr[i].toString(2)
    const v = one.match(/^1+?(?=0)/)
    if (v && one.length === 8) {
      const bytesLength = v[0].length
      let store = _arr[i].toString(2).slice(7 - bytesLength)
      for (var st = 1; st < bytesLength; st++) {
        store += _arr[st + i].toString(2).slice(2)
      }
      str += String.fromCharCode(parseInt(store, 2))
      i += bytesLength - 1
    } else {
      str += String.fromCharCode(_arr[i])
    }
  }
  return str
}

function byteToString(arr) {
  if (typeof arr === 'string') {
    return arr
  }
  let str = ''
  const _arr = arr
  for (let i = 0; i < _arr.length; i++) {
    const one = _arr[i].toString(2)
    const v = one.match(/^1+?(?=0)/)
    if (v && one.length === 8) {
      const bytesLength = v[0].length
      let store = _arr[i].toString(2).slice(7 - bytesLength)
      for (var st = 1; st < bytesLength; st++) {
        store += _arr[st + i].toString(2).slice(2)
      }
      str += String.fromCharCode(parseInt(store, 2))
      i += bytesLength - 1
    } else {
      str += String.fromCharCode(_arr[i])
    }
  }
  return str
}

function bytesToCode(bytes) {
  const codes = []
  Array.from(bytes, byte => {
    if (byte !== 0) {
      codes.push(byte)
    }
  })
  return byteToString(codes)
}
//十六进制字符串转字节数组
function Str2Bytes(str){
    var pos = 0;
    var len = str.length;
    if(len %2 != 0){
       return null; 
    }
    len /= 2;
    var hexA = new Array();
    for(var i=0; i<len; i++){
       var s = str.substr(pos, 2);
       var v = parseInt(s, 16);
       hexA.push(v);
       pos += 2;
    }
    return hexA;
}

var CRC = {};
CRC._auchCRCHi = [
  0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
  0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
  0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
  0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
  0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
  0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
  0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
  0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
  0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
  0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
  0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
  0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
  0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
  0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
  0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
  0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
  0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
  0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
  0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
  0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
  0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
  0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
  0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
  0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
  0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
  0x80, 0x41, 0x00, 0xC1, 0x81, 0x40
];
CRC._auchCRCLo = [
  0x00, 0xC0, 0xC1, 0x01, 0xC3, 0x03, 0x02, 0xC2, 0xC6, 0x06,
  0x07, 0xC7, 0x05, 0xC5, 0xC4, 0x04, 0xCC, 0x0C, 0x0D, 0xCD,
  0x0F, 0xCF, 0xCE, 0x0E, 0x0A, 0xCA, 0xCB, 0x0B, 0xC9, 0x09,
  0x08, 0xC8, 0xD8, 0x18, 0x19, 0xD9, 0x1B, 0xDB, 0xDA, 0x1A,
  0x1E, 0xDE, 0xDF, 0x1F, 0xDD, 0x1D, 0x1C, 0xDC, 0x14, 0xD4,
  0xD5, 0x15, 0xD7, 0x17, 0x16, 0xD6, 0xD2, 0x12, 0x13, 0xD3,
  0x11, 0xD1, 0xD0, 0x10, 0xF0, 0x30, 0x31, 0xF1, 0x33, 0xF3,
  0xF2, 0x32, 0x36, 0xF6, 0xF7, 0x37, 0xF5, 0x35, 0x34, 0xF4,
  0x3C, 0xFC, 0xFD, 0x3D, 0xFF, 0x3F, 0x3E, 0xFE, 0xFA, 0x3A,
  0x3B, 0xFB, 0x39, 0xF9, 0xF8, 0x38, 0x28, 0xE8, 0xE9, 0x29,
  0xEB, 0x2B, 0x2A, 0xEA, 0xEE, 0x2E, 0x2F, 0xEF, 0x2D, 0xED,
  0xEC, 0x2C, 0xE4, 0x24, 0x25, 0xE5, 0x27, 0xE7, 0xE6, 0x26,
  0x22, 0xE2, 0xE3, 0x23, 0xE1, 0x21, 0x20, 0xE0, 0xA0, 0x60,
  0x61, 0xA1, 0x63, 0xA3, 0xA2, 0x62, 0x66, 0xA6, 0xA7, 0x67,
  0xA5, 0x65, 0x64, 0xA4, 0x6C, 0xAC, 0xAD, 0x6D, 0xAF, 0x6F,
  0x6E, 0xAE, 0xAA, 0x6A, 0x6B, 0xAB, 0x69, 0xA9, 0xA8, 0x68,
  0x78, 0xB8, 0xB9, 0x79, 0xBB, 0x7B, 0x7A, 0xBA, 0xBE, 0x7E,
  0x7F, 0xBF, 0x7D, 0xBD, 0xBC, 0x7C, 0xB4, 0x74, 0x75, 0xB5,
  0x77, 0xB7, 0xB6, 0x76, 0x72, 0xB2, 0xB3, 0x73, 0xB1, 0x71,
  0x70, 0xB0, 0x50, 0x90, 0x91, 0x51, 0x93, 0x53, 0x52, 0x92,
  0x96, 0x56, 0x57, 0x97, 0x55, 0x95, 0x94, 0x54, 0x9C, 0x5C,
  0x5D, 0x9D, 0x5F, 0x9F, 0x9E, 0x5E, 0x5A, 0x9A, 0x9B, 0x5B,
  0x99, 0x59, 0x58, 0x98, 0x88, 0x48, 0x49, 0x89, 0x4B, 0x8B,
  0x8A, 0x4A, 0x4E, 0x8E, 0x8F, 0x4F, 0x8D, 0x4D, 0x4C, 0x8C,
  0x44, 0x84, 0x85, 0x45, 0x87, 0x47, 0x46, 0x86, 0x82, 0x42,
  0x43, 0x83, 0x41, 0x81, 0x80, 0x40
];

CRC.CRC16 = function (buffer) {
  var hi = 0xff;
  var lo = 0xff;
  for (var i = 0; i < buffer.length; i++) {
      var idx = hi ^ buffer[i];
      hi = (lo ^ CRC._auchCRCHi[idx]);
      lo = CRC._auchCRCLo[idx];
  }
  return CRC.padLeft((hi << 8 | lo).toString(16).toUpperCase(), 4, '0');
};

CRC.isArray = function (arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
};

CRC.ToCRC16 = function (str) {
  return CRC.CRC16(CRC.isArray(str) ? str : CRC.strToByte(str));
};

CRC.ToModbusCRC16 = function (str) {
  return CRC.CRC16(CRC.isArray(str) ? str : CRC.strToHex(str));
};

CRC.strToByte = function (str) {
  var tmp = str.split(''), arr = [];
  for (var i = 0, c = tmp.length; i < c; i++) {
      var j = encodeURI(tmp[i]);
      if (j.length == 1) {
          arr.push(j.charCodeAt());
      } else {
          var b = j.split('%');
          for (var m = 1; m < b.length; m++) {
              arr.push(parseInt('0x' + b[m]));
          }
      }
  }
  return arr;
};

CRC.convertChinese = function (str) {
  var tmp = str.split(''), arr = [];
  for (var i = 0, c = tmp.length; i < c; i++) {
      var s = tmp[i].charCodeAt();
      if (s <= 0 || s >= 127) {
          arr.push(s.toString(16));
      }
      else {
          arr.push(tmp[i]);
      }
  }
  return arr;
};

CRC.filterChinese = function (str) {
  var tmp = str.split(''), arr = [];
  for (var i = 0, c = tmp.length; i < c; i++) {
      var s = tmp[i].charCodeAt();
      if (s > 0 && s < 127) {
          arr.push(tmp[i]);
      }
  }
  return arr;
};

CRC.strToHex = function (hex, isFilterChinese) {
  hex = isFilterChinese ? CRC.filterChinese(hex).join('') : CRC.convertChinese(hex).join('');

  //清除所有空格
  hex = hex.replace(/\s/g, "");
  //若字符个数为奇数，补一个空格
  hex += hex.length % 2 != 0 ? " " : "";

  var c = hex.length / 2, arr = [];
  for (var i = 0; i < c; i++) {
      arr.push(parseInt(hex.substr(i * 2, 2), 16));
  }
  return arr;
};

CRC.padLeft = function (s, w, pc) {
  if (pc == undefined) {
      pc = '0';
  }
  for (var i = 0, c = w - s.length; i < c; i++) {
      s = pc + s;
  }
  return s;
};

module.exports = {
  formatTime: formatTime,
  readBLECharacteristicValue: readBLECharacteristicValue,
  writeBLECharacteristicValue: writeBLECharacteristicValue,
  writeOnebyOne:writeOnebyOne,
  string2buffer: string2buffer,
  stringToBytes: stringToBytes,
  ab2str: ab2str,
  CheckCRC: CheckCRC,
  intTO2Bytes: intTO2Bytes,
  intTO4Bytes: intTO4Bytes,
  calculateCRC: calculateCRC,
  onBLEConnectionState: onBLEConnectionState,
  checkOpenIdValidation: checkOpenIdValidation,
  startNotice: startNotice,
  toUint8ab: toUint8ab,
  Str2Bytes: Str2Bytes,
  bytes4ToInt: bytes4ToInt,
  hexCharCodeToStr: hexCharCodeToStr
}
