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
    devices: [],
    connected: false,
    chs: [],
    //油品信息
    receiveOilinfo:'',
    receiveOildensity:'',
    oildatas:[
      {"name":"01","density":"text1","correctionFactor":"type1"},
      {"name":"02","density":"text2","correctionFactor":"type2"},
      {"name":"03","density":"text3","correctionFactor":"type3"},
      {"name":"04","density":"text4","correctionFactor":"type4"},
      {"name":"05","density":"text5","correctionFactor":"type5"},
      {"name":"06","density":"text6","correctionFactor":"type6"},
      {"name":"07","density":"text7","correctionFactor":"type7"}
      ],
    oilNames:[],
    oildensity:[],
    correctionFactor:[],
    //计量系统
    //系数
    receiveMeasureInfo:'',
    receiveCorrectionFactorHighFlow:'',
    receiveClass:'',
    receiveConversion:'',
    coefficientLowFlow:'',
    coefficientHighFlow:'',
    LowFlowratecoefficient:'',
    HighFlowratecoefficient:'',
    CorrectionFactorLowFlow:'',
    CorrectionFactorHighFlow:'',
    //体积转换
    ConversionEnable:'',
    Conversionmaindisplay:'',
    RefTemperature:'',
    //温度
    TemperatureState:'',
    TemperatureMin:'',
    TemperatureMax:'',
    //流速
    MinimumFlowrate:'',
    MaximumFlowrate:'',
    //传感器
    sensor:'',
    receiveDirection:'',
    //方向
    Directiondetection:'',
    correctionfactor:'',
    Displayloadingquantity:'',
    //体积
    VolumeMin:'',
    VolumeSettingFixedVolume:'',
    Class:'',
    //连接状态
    receiveMPLS:'',
    MPLSState:'',//MPLS
    MPLSSerialnumber:'',
    //PLATE NUMBER
    receivePlateNumber:'',
    PlateNumber:'',
    //体积设置
    VolumeHighFlowtoLowFlow:'',
    //流速设置
    receiveflow:'',
    Objectivelowflow:'',
    LowflowtoHighflowThreshold:'',

  },
    //获取油品信息
    getOilInfo(){
      //获取油标准密度（Density at 15, Product #1）308--338 但是截止到340，共32*4位，个字节，32个寄存器
      var param='010301340020';//
      this.getInfo(param,308);
    },
  //获取计量系统信息
  getMeasuringSys(){
    //获取800--851 但是截止到852，共52*4位，个字节，52个寄存器
    var param='010303200034';//
    this.getInfo(param,800);
  },
  //获取连接状态
  getConnectStatus(){
    //获取9033--9034 但是截止到，共3*4位，12个字节，3个寄存器
    var param='010323490003';//
    this.getInfo(param,9033);
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
  //解析油品标准密度
  processOildensity(receiveData1){
    var oildensity=[];
    receiveData1=receiveData1.substr(0,32*4+6+4);
    log.info('解析油品标准密度'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析油品标准密度*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      for(let i=0;i<16;i++){
        oildensity[i]=this.convertFloat8(receiveData1.substr(start+(8*i),8)).toFixed(1);
      }
      this.setData({
        oildensity:oildensity
      })
    }
    //获取油品信息（名称）5000--5304,304*4位，4个字节，304个寄存器，一次取4个油品，最多76个寄存器。每次判断，若没有油品名则后续不需要再获取
    this.getInfo('01031388004C',5000);
  },
  //解析油品信息（名称）
  processOilinfo(receiveData1,address){
    var oilNames=this.data.oilNames;
    var correctionFactor=this.data.correctionFactor;
    receiveData1=receiveData1.substr(0,76*4+6+4);
    log.info('解析油品信息（名称）'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析油品信息*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let j=oilNames.length;
      for(let i=0;i<4;i++){
        console.log(receiveData1.substr(start+(76*i),16));
        oilNames[j+i]=util.hexCharCodeToStr(receiveData1.substr(start+(76*i),16));
        let factor=this.convertFloat8(receiveData1.substr(start+52+(76*i),8));
        correctionFactor[j+i]=factor===0?'':factor;
      }
      this.setData({
        oilNames:oilNames,
        correctionFactor:correctionFactor
      })
      if(this.testStrReg(oilNames[oilNames.length-1])){//本次数据最后一条不是空，继续获取下4条
        address+=19;
        let num=address.toString(16);//必然为4位，无需前加0
        console.log('0103'+num+'004C');
        this.getInfo('0103'+num+'004C',address);
      }else{//全部解析完成，填充数据
        var oildensity=this.data.oildensity;
        var oildatas=[];
        for(let i=0;i<this.data.oilNames.length;i++){//此处不能用j，第一次进入j为0
          var oil={"name":oilNames[i],"density":oildensity[i],"correctionFactor":correctionFactor[i]};
          oildatas.push(oil);
        }
        this.setData({
          oildatas:oildatas
        })
      }
    }
    this.getMeasuringSys();
  },
  //验证字符串是否为中文、英文或数字
  testStrReg(str){
    var pattern1 = new RegExp("[\u4E00-\u9FA5]+");//中文
    var pattern2 = new RegExp("[A-Za-z]+");//英文
    var pattern3 = new RegExp("[0-9]+");//数字
    if(pattern1.test(str) || pattern2.test(str) || pattern3.test(str)){
      return true;
    }else{
      return false;
    }
  },
  //解析计量系统信息
  processMeasureSys(receiveData1){
    receiveData1=receiveData1.substr(0,52*4+6+4);
    log.info('解析计量系统信息'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析计量系统信息*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let coefficientLowFlow=this.convertFloat8(receiveData1.substr(start,8)).toFixed(5);
      let coefficientHighFlow=this.convertFloat8(receiveData1.substr(start+=8,8)).toFixed(5);
      let LowFlowratecoefficient=this.convertFloat8(receiveData1.substr(start+=16,8));
      let HighFlowratecoefficient=this.convertFloat8(receiveData1.substr(start+=16,8));
      console.log('*************低流量校正系数',this.int2Short(receiveData1.substr(start+16,4)));
      let CorrectionFactorLowFlow=parseInt(receiveData1.substr(start+=16,4),16);
      //let CorrectionFactorHighFlow=util.hexCharCodeToStr(receiveData1.substr(start+=4,4));//另一个命令取
      let TemperatureState=parseInt(receiveData1.substr(start+=4,4),16);
      let TemperatureMin=this.convertFloat8(receiveData1.substr(start+=20,8));
      let TemperatureMax=this.convertFloat8(receiveData1.substr(start+=8,8));
      let MinimumFlowrate=this.convertFloat8(receiveData1.substr(start+=12,8))/1000;
      let MaximumFlowrate=this.convertFloat8(receiveData1.substr(start+=8,8))/1000;
      let VolumeMin=this.convertFloat8(receiveData1.substr(start+=24,8));
      let VolumeSettingFixedVolume=this.convertFloat8(receiveData1.substr(start+=56,8));
      let VolumeHighFlowtoLowFlow=parseInt(receiveData1.substr(start+=16,4),16);//体积设置 Volume Setting, High Flow to Low Flow
      if(TemperatureState===1){
        TemperatureState='已开启';
      }else{
        TemperatureState='已关闭';
      }
      this.setData({
        coefficientLowFlow: coefficientLowFlow,
        coefficientHighFlow:coefficientHighFlow,
        LowFlowratecoefficient:LowFlowratecoefficient,
        HighFlowratecoefficient:HighFlowratecoefficient,
        CorrectionFactorLowFlow:CorrectionFactorLowFlow,
        TemperatureState:TemperatureState,
        TemperatureMin:TemperatureMin,
        TemperatureMax:TemperatureMax,
        MinimumFlowrate:MinimumFlowrate,
        MaximumFlowrate:MaximumFlowrate,
        VolumeMin:VolumeMin,
        VolumeSettingFixedVolume:VolumeSettingFixedVolume,
        VolumeHighFlowtoLowFlow:VolumeHighFlowtoLowFlow 
      })
    }
    // 获取高流量校正系数882--，共1*4位，4个字节，1个寄存器
    this.getInfo('010303720001',882);
  },
  int2Short(i){
    var a=[];   
    a[0] = i & 0x0000ffff;          //将整型的低位取出,   
    a[1] = i >> 16;                     //将整型的高位取出.   
    return a
  },
  //解析高流量校正系数
  processCorrectionFactorHighFlow(receiveData1){
    receiveData1=receiveData1.substr(0,1*4+6+4);
    log.info('解析高流量校正系数'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析高流量校正系数*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      console.log('*************高流量校正系数',this.int2Short(receiveData1.substr(start,4)));
      let CorrectionFactorHighFlow=parseInt(receiveData1.substr(start,4),16);
      this.setData({
        CorrectionFactorHighFlow:CorrectionFactorHighFlow
      })
    }
    //获取精度23--,1*4位，4个字节，1个寄存器
    this.getInfo('010300170001',23);
  },
  //解析精度class
  processClass(receiveData1){
    receiveData1=receiveData1.substr(0,1*4+6+4);
    log.info('解析精度class'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析精度*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let Class=parseInt(receiveData1.substr(start,4),16)/10;
      this.setData({
        Class: Class
      })
    }
    //获取体积转换300--308,8*4位，个字节，8个寄存器
    this.getInfo('0103012C0008',300);

  },
  //解析体积转换
  processConversion(receiveData1){
    receiveData1=receiveData1.substr(0,8*4+6+4);
    log.info('解析体积转换'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析体积转换*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let ConversionEnable=parseInt(receiveData1.substr(start,4),16);
      let Conversionmaindisplay=parseInt(receiveData1.substr(start+=4,4),16);
      console.log('*************体积转换标准温度',receiveData1.substr(start+20,8));
      let RefTemperature=this.convertFloat8(receiveData1.substr(start+=20,8));
      if(ConversionEnable===1){
        ConversionEnable='已开启';
      }else{
        ConversionEnable='已关闭';
      }
      if(Conversionmaindisplay===0){
        Conversionmaindisplay='VM';
      }else if(Conversionmaindisplay===1){
        Conversionmaindisplay='VB';
      }else if(Conversionmaindisplay===2){
        Conversionmaindisplay='MASS';
      }
      this.setData({
        ConversionEnable: ConversionEnable,
        Conversionmaindisplay: Conversionmaindisplay,
        RefTemperature: RefTemperature
      })
    }
    //获取方向以及液体传感器状态1300--1306,6*4位，个字节，6个寄存器
    this.getInfo('010305140006',1300);
  },
  //解析方向以及液体传感器状态
  processDirection(receiveData1){
    receiveData1=receiveData1.substr(0,6*4+6+4);
    log.info('解析方向以及液体传感器状态'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析方向以及液体传感器状态*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let Directiondetection=parseInt(receiveData1.substr(start,4),16);
      let correctionfactor=this.convertFloat8(receiveData1.substr(start+=4,8));
      let Displayloadingquantity=parseInt(receiveData1.substr(start+=8,4),16);
      let sensor=parseInt(receiveData1.substr(start+=8,4),16);
      if(Directiondetection===1){
        Directiondetection='开启';
      }else{
        Directiondetection='关闭';
      }
      if(Displayloadingquantity===1){
        Displayloadingquantity='开启';
      }else{
        Displayloadingquantity='关闭';
      }
      if(sensor===2){
        sensor='液体传感器';
      }else{
        sensor='气体传感器';
      }
      this.setData({
        Directiondetection: Directiondetection,
        correctionfactor: correctionfactor,
        Displayloadingquantity: Displayloadingquantity,
        sensor: sensor,
      })
    }
    this.getConnectStatus();

  },
  //解析MPLS
  processMPLS(receiveData1){
    receiveData1=receiveData1.substr(0,3*4+6+4);
    log.info('解析MPLS'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析MPLS*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let MPLSState=parseInt(receiveData1.substr(start,4),16);
      let MPLSSerialnumber=util.hexCharCodeToStr(receiveData1.substr(start+=4,8));
      if(MPLSState===1){
        MPLSState='开启';
      }else{
        MPLSState='关闭';
      }
      this.setData({
        MPLSState: MPLSState,
        MPLSSerialnumber: MPLSSerialnumber
      })
    }
    //获取plateNumber6400,5*4位，个字节，5个寄存器
    this.getInfo('010319000005',6400);
  },
  //解析plateNumber
  processPlateNumber(receiveData1){
    receiveData1=receiveData1.substr(0,5*4+6+4);
    log.info('解析plateNumber'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析plateNumber*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let PlateNumber=util.hexCharCodeToStr(receiveData1.substr(start,20));
      this.setData({
        PlateNumber: PlateNumber
      })
    }
    //获取流速设置7003-7006,3*4位，个字节，3个寄存器
    this.getInfo('01031b5b0003',7003);
  },
  //解析流速设置
  processFlow(receiveData1){
    receiveData1=receiveData1.substr(0,3*4+6+4);
    log.info('解析流速设置'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    console.log('******解析流速设置*******',receiveData);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      return ;
    } else {
      let start=6;
      let Objectivelowflow=parseInt(receiveData1.substr(start,4),16);
      let LowflowtoHighflowThreshold=this.convertFloat8(receiveData1.substr(start+=4,8));
      this.setData({
        Objectivelowflow: Objectivelowflow,
        LowflowtoHighflowThreshold: LowflowtoHighflowThreshold
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
    this.getOilInfo();
    // if(util.checkOpenIdValidation()){
      // let state=util.onBLEConnectionState();
      // if(!state){
      //   console.info('跳转蓝牙链接页面')
      //   wx.showModal({
      //     title: '当前蓝牙未连接,跳转蓝牙设备选择配对页面',
      //     showCancel: false,
      //     success (res) {
      //       wx.navigateTo({
      //         url: '../bluetooth/bluetooth',
      //       })
      //     }
      //   })
      // }  
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
          if(address===800){
            that.setData({
              receiveMeasureInfo:that.data.receiveMeasureInfo.concat(dataRe)
            })
          }
          if(address===882){
            that.setData({
              receiveCorrectionFactorHighFlow:that.data.receiveCorrectionFactorHighFlow.concat(dataRe)
            })
          }
          if(address===23){
            that.setData({
              receiveClass:that.data.receiveClass.concat(dataRe)
            })
          }
          if(address===300){
            that.setData({
              receiveConversion:that.data.receiveConversion.concat(dataRe)
            })
          }
          if(address===1300){
            that.setData({
              receiveDirection:that.data.receiveDirection.concat(dataRe)
            })
          }
          if(address===9033){
            that.setData({
              receiveMPLS:that.data.receiveMPLS.concat(dataRe)
            })
          }
          if(address===6400){
            that.setData({
              receivePlateNumber:that.data.receivePlateNumber.concat(dataRe)
            })
          }
          if(address===7003){
            that.setData({
              receiveflow:that.data.receiveflow.concat(dataRe)
            })
          }
          if(address===308){
            that.setData({
              receiveOildensity:that.data.receiveOildensity.concat(dataRe)
            })
          }
          if(address>=5000 && address<=5303){
            that.setData({
              receiveOilinfo:that.data.receiveOilinfo.concat(dataRe)
            })
          }

         // console.log('接收到数据16进制++：',that.data.receiveDatas);
          index++;
            if(address===800 && index>7){//计量
              that.processMeasureSys(that.data.receiveMeasureInfo);
            }else
            if(address===882 && index>2){//高流量校正系数
              that.processCorrectionFactorHighFlow(that.data.receiveCorrectionFactorHighFlow);
            }else
            if(address===23 && index>2){//精度
              that.processClass(that.data.receiveClass);
            }else
            if(address===300 && index>3){//体积转换
              that.processConversion(that.data.receiveConversion);
            }else
            if(address===1300 && index>2){//方向以及液体传感器状态
              that.processDirection(that.data.receiveDirection);
            }else
            if(address===9033 && index>2){//MPLS
              that.processMPLS(that.data.receiveMPLS);
            }else
            if(address===6400 && index>2){//plateNumber
              that.processPlateNumber(that.data.receivePlateNumber);
            }else
            if(address===7003 && index>2){//流速设置
              that.processFlow(that.data.receiveflow);
            }else
            if(address===308 && index>5){//油标准密度
              that.processOildensity(that.data.receiveOildensity);
            }else
            if(address>=5000 && address<=5303 && index>9){//解析油品信息（名称）
              that.processOilinfo(that.data.receiveOilinfo,address);
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