
const app=getApp();
var util = require('../../utils/util.js');
const log = require('../../log.js')
var dateTimePicker = require('../../utils/dateTimePicker.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    versionNo: app.globalData.versionNo,
    receiveMeasurementDay:'',
    receiveMeasurementDayTotalNum:'',
    receiveMeasurementDayNum:'',
    receiveMeasurementsInfo1:'',
    receiveMeasurementsInfo2:'',

    //列表循环展示数据
    measurementsInfo:[
      // {"OperationID":"01","Vt":"1000","V20":"1000","oilName":"type1","operateTime":"type1"},
      // {"OperationID":"02","Vt":"1000","V20":"1000","oilName":"type2","operateTime":"type2"},
      ],
    measurement1:[],//数据信息数组
    measurement2:[],//数据信息数组

    date1:'',//开始时间
    date2:'',//结束时间
    index:'',//当天数据第几条
    shows: true,
    showDataDetail: false,

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
  //点击查询，选择时间
  query(){
    this.setData({shows:false});
  },
    //1、按照查询时间倒着一天一天写入要查询那一天数据 address 10000 (0x2710)：0110271000050A0014030C000000000001 ，2、获取当天的条数address 10005 (0x2715)：01032715000A ，3、写入要读哪一条address 10004 (0x2714)：010627140002（第二条，共2条则为最新那条）
  sureToQuery(){
    if(this.data.date1 && this.data.date2 && (this.data.date1 <= this.data.date2 )){
      this.setData({shows:true});
      this.writeMeasurementsDay(); 
      wx.showLoading({
        title: '查找中',
      })
    }else{
      wx.showModal({
        title: '请选择正确的起止时间',
        showCancel: false,
        confirmText: '确定',
        complete:function(){
          wx.navigateBack();
        }
      })
    }
  },
  //写入查询某天数据
  writeMeasurementsDay(){
    //写入要查询那一天数据 address 10000 (0x2710)，共5*4位，108个字节，5个寄存器
    var param='0110271000050A';
    let date1=this.data.date1;
    let date2=this.data.date2;
    let date;
    //循环按最近的一天，每次向前一天查询数据
    if(this.datedifference(date1,date2)>=0){
      date = date2;
      let dateArr=date.split('-');
      let year=parseInt(dateArr[0].substr(2,2));
      let month=parseInt(dateArr[1]);
      let day=parseInt(dateArr[2]);
      if(day<16){
        param=param+'00'+year.toString(16)+ '0'+ month.toString(16)+'0'+day.toString(16);
      }else{
        param=param+'00'+year.toString(16)+'0'+  month.toString(16)+day.toString(16);
      }
      console.log('-----查询哪天的条数：',date);
      this.getInfo(param,10000);
    }else{
      wx.hideLoading();
      return;
    } 
  },
  //2、获取当天的条数address 10005 (0x2715)：01032715000A
  getMeasurementDayTotalNum(){
    this.getInfo('01032715000A',10005);
  },
   //获取信息
   getInfo(param,address){
    param=param+'0000'
    let bytes=util.Str2Bytes(param);
    var crcBuf=[];
    try{
      crcBuf=util.calculateCRC(bytes,bytes.length-2);
    }catch(e){
      console.log('捕获到异常：',e);
      wx.hideLoading();
      return;
    }
    //var crcBuf=util.CRC16(bytes);
    bytes[bytes.length-2]=crcBuf[0];
    bytes[bytes.length-1]=crcBuf[1];
    let buffer= new Int8Array(bytes).buffer;//array转arraybuffer-------------
    console.log(buffer);
    //util.startNotice(buffer);
    this.getBLEDeviceCharacteristics(app.globalData.bluetoothInfo.deviceId, app.globalData.bluetoothInfo.serviceId, buffer,0,address) 
  },
  //解析写入查询某天数据
  processMeasurementDay(receiveData1){
    receiveData1=receiveData1.substr(0,16);
    log.info('解析写入查询某天数据'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      wx.hideLoading();
      wx.showModal({
        title: '查找错误，请重新查找',
        showCancel: false,
        confirmText: '确定',
        complete:function(){
        }
      })
      return ;
    } else {
      //2、获取当天的条数address 10005 (0x2715)：01032715000A
      setTimeout(this.getMeasurementDayTotalNum,300);//200m后才可以读取当天条数
      //向前一天查询数据
      let date2=this.data.date2;
      let date=this.getNextDate(date2,-1);
      this.setData({
        date2:date
      }); 
    }
  },
  //解析当天条数
  processCurrentNum(receiveData1){
    receiveData1=receiveData1.substr(0,10*4+6+4);
    console.log('******解析当天条数****',receiveData1);
    log.info('解析当天条数'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      wx.hideLoading();
      wx.showModal({
        title: '查找错误，请重新查找',
        showCancel: false,
        confirmText: '确定',
        complete:function(){
        }
      })
      return ;
    } else {
      let start=6;
      let num=parseInt(receiveData1.substr(start,4),16);
      this.setData({
        index:num
      })
      console.log('******解析当天条数***有几条数据**',num);
      if(num>0){
        this.writeMeasurementDayNum();
      }else{//下一天
        this.writeMeasurementsDay();
      }
      
      
    }
  },

  //写入读取该天第几条的数据
  writeMeasurementDayNum(){
    var param='01062714';//3、写入要读哪一条address 10004 (0x2714)
    let num=this.data.index;
    console.log('******'+this.data.date2+'该天数据条数为****',num);
    if(num>0){
      let index=num>16?num.toString(16):'0'+num.toString(16);
      this.getInfo(param+'00'+index,10004);

    }else{
      return;
    }
  },
  //解析写入获取该天指定第几条数据
  processMeasurementDayNum(receiveData1){
    receiveData1=receiveData1.substr(0,16);
    console.log('******解析写入获取该天指定第几条数据****',receiveData1);
    log.info('解析写入获取该天指定第几条数据'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      wx.hideLoading();
      wx.showModal({
        title: '查找错误，请重新查找',
        showCancel: false,
        confirmText: '确定',
        complete:function(){
        }
      })
      return ;
    } else {
      //4、读取该条信息 10100 (0x2774) for 65 registers  010327740041
      setTimeout(this.getInfo('010327740041',10100),300);//200ms后才可以读取该条信息
      this.setData({
        index:index-1
      })
    }
  },
  //解析记录内容
  processMeasurement1(receiveData1){
    receiveData1=receiveData1.substr(0,65*4+6+4);
    console.log('******解析记录内容****',receiveData1);
    log.info('解析记录内容'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      wx.hideLoading();
      wx.showModal({
        title: '查找错误，请重新查找',
        showCancel: false,
        confirmText: '确定',
        complete:function(){
        }
      })
      return ;
    } else {
      let start=6;
      //let day=parseInt(receiveData1.substr(start,8),16);//0x00yymmdd
      let year=parseInt(receiveData1.substr(start,4),16);
      let month=parseInt(receiveData1.substr(start+=2,),16);
      let day=parseInt(receiveData1.substr(start+=2,4),16);
      let date='20'+year+'-'+month+'-'+day;
      let OperationID=parseInt(receiveData1.substr(start+=20,4),16);
      let volume='';
      let direction='';
      let startTime=parseInt(receiveData1.substr(start+=4,4),16);//0xhhmm 
      let endTime=parseInt(receiveData1.substr(start+=4,4),16);//0xhhmm 
      let Vt=this.convertFloat8(receiveData1.substr(start+=8,8));//Vm
      volume=Vt;
      let V20=this.convertFloat8(receiveData1.substr(start+=12,8));//Vb
      let temp=this.convertFloat8(receiveData1.substr(start+=12,8));//温度
      let mass=this.convertFloat8(receiveData1.substr(start+=12,8));//质量
      let density=this.convertFloat8(receiveData1.substr(start+=88,8));//密度
      let oilCode=parseInt(receiveData1.substr(start+=8,4),16);//油品序号
      let oilName=util.hexCharCodeToStr(receiveData1.substr(start+=4,32));//油品名称
      let latitude=this.convertFloat8(receiveData1.substr(start+=64,8));//纬度
      let longitude=this.convertFloat8(receiveData1.substr(start+=8,8));//经度
      var oil={"OperationID":OperationID,"oilName":oilName,"date":date,"startTime":startTime,"endTime":endTime,"oilCode":oilCode,"density":density,"Vt":Vt,"name":oilNames[i],"V20":V20,"direction":direction,"temp":temp,"mass":mass,"longitude":longitude,"latitude":latitude};
      //let measurementInfo={"OperationID":OperationID,"volume":volume,"oilName":oilName,"operateTime":operateTime};
      let measurementInfo={"OperationID":OperationID,"Vt":Vt,"V20":V20,"oilName":oilName,"operateTime":operateTime};
      let measurement1=this.data.measurement1;
      let measurementsInfo=this.data.measurementsInfo;
      measurement1.push(oil);
      measurementsInfo.push(measurementInfo);
      this.setData({
        measurement1:measurement1,
        measurementsInfo:measurementsInfo
      })
      //放入全局变量中
      app.globalData.measurement1=measurement1;
      app.globalData.measurementsInfo=measurementsInfo;

      //继续获取该条剩下的信息 10172-10184  12 register
      this.getInfo('010327BC000C',10172);
    }
  },
  //解析剩下的记录内容
  processMeasurement2(receiveData1){
    receiveData1=receiveData1.substr(0,12*4+6+4);
    console.log('******解析剩下的记录内容****',receiveData1);
    log.info('解析剩下的记录内容'+receiveData1);
    let receiveData=util.Str2Bytes(receiveData1);
    if (!util.CheckCRC(receiveData)) {
      console.log("CRC校验错误"); // CRC校验错误
      wx.hideLoading();
      wx.showModal({
        title: '查找错误，请重新查找',
        showCancel: false,
        confirmText: '确定',
        complete:function(){
        }
      })
      return ;
    } else {
      let start=6;
      let flowrate=this.convertFloat8(receiveData1.substr(start,8));//流速
      let direction=parseInt(receiveData1.substr(start+=28,4),16);//来源（方向）
      let Signigifiantdefault=parseInt(receiveData1.substr(start+=4,8),16);
      let NoSignigifiantdefault=parseInt(receiveData1.substr(start+=8,8),16);
      if(direction===1){
        direction='卸油'
      }else{
        direction='进油'
      }
      var oil={"flowrate":flowrate,"direction":direction,"Signigifiantdefault":Signigifiantdefault,"NoSignigifiantdefault":NoSignigifiantdefault};
      var measurement2=[];
      measurement2.push(oil);
      this.setData({
        measurement2:measurement2
      })
      //放入全局变量中
      app.globalData.measurement2=measurement2;
      let num=this.data.index;
      if(num>0){
        this.writeMeasurementDayNum();//继续查该天下一条
      }else{
        this.writeMeasurementsDay();//继续查询下一天
      }
     
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
          if(address===10000){
            that.setData({
              receiveMeasurementDay:that.data.receiveMeasurementDay.concat(dataRe)
            })
          }
          if(address===10005){
            that.setData({
              receiveMeasurementDayTotalNum:that.data.receiveMeasurementDayTotalNum.concat(dataRe)
            })
          }
          if(address===10004){
            that.setData({
              receiveMeasurementDayNum:that.data.receiveMeasurementDayNum.concat(dataRe)
            })
          }
          if(address===10100){
            that.setData({
              receiveMeasurementsInfo1:that.data.receiveMeasurementsInfo1.concat(dataRe)
            })
          }
          if(address===10172){
            that.setData({
              receiveMeasurementsInfo2:that.data.receiveMeasurementsInfo2.concat(dataRe)
            })
          }
         // console.log('接收到数据16进制++：',that.data.receiveDatas);
          index++;
          if(address===10000 && index>2){//写入获取某天数据
            that.processMeasurementDay(that.data.receiveMeasurementDay);
          }else
          if(address===10005 && index>3){//获取该天条数
            that.processCurrentNum(that.data.receiveMeasurementDayTotalNum);
          }else
          if(address===10004 && index>2){//写入获取某条数据
            that.processMeasurementDayNum(that.data.receiveMeasurementDayTotalNum);
          }else
          if(address===10100 && index>8){//获取信息
            that.processMeasurement1(that.data.receiveMeasurementsInfo1);
          }else
          if(address===10172 && index>3){//获取信息
            that.processMeasurement2(that.data.receiveMeasurementsInfo2);
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
  },
  //选择开始时间
  changeDate1(e){
    this.setData({ date1:e.detail.value});
  },
  //选择结束时间
  changeDate2(e){
    this.setData({ date2:e.detail.value});
  },
  getNextDate(date,day) {  
    var dd = new Date(date);
    dd.setDate(dd.getDate() + day);
    var y = dd.getFullYear();
    var m = dd.getMonth() + 1 < 10 ? "0" + (dd.getMonth() + 1) : dd.getMonth() + 1;
    var d = dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate();
    return y + "-" + m + "-" + d;
  },
  //两个时间相差天数 兼容firefox chrome    
  datedifference(sDate1, sDate2) {    
    //sDate1和sDate2是2006-12-18格式          
    var dateSpan, iDays;        
    sDate1 = Date.parse(sDate1);        
    sDate2 = Date.parse(sDate2);        
    dateSpan = sDate2 - sDate1;        
    //dateSpan = Math.abs(dateSpan);     
    iDays = Math.floor(dateSpan / (24 * 3600 * 1000));   
    return iDays ;
  },
  checkboxChange(e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value)

    const items = this.data.measurementsInfo
    const values = e.detail.value
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].checked = false

      for (let j = 0, lenJ = values.length; j < lenJ; ++j) {
        if (items[i].OperationID === values[j]) {
          items[i].checked = true

          break
        }
      }
    }
    this.setData({
      items
    })
  },
  setMeasurementInfo(e){
    let i=e.currentTarget.dataset.text;
    const items = this.data.measurementsInfo;
    const measurement = items[i];
    this.setData({
      showDataDetail: true,
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
  //选中的赋值到全局变量后跳转pdf页面
  toPdf(e){
    let wordOrPDF=e.currentTarget.dataset.text;
    if(wordOrPDF==='word'){
      wordOrPDF=true
    }else{
      wordOrPDF=false
    }
    app.globalData.wordOrPDF=wordOrPDF;
    this.getPDF();
    //pdffile.saveToPDF();
  },
  getPDF(){
    //清空上次push进去的
    app.globalData.measurementsInfo=[];
    app.globalData.measurement1=[];
    app.globalData.measurement2=[];
    app.globalData.wordOrPDF=true;

    const items = this.data.measurementsInfo;
    const measurement1 = this.data.measurement1;
    const measurement2 = this.data.measurement2;
    for(let i=0;i<items.length;i++){
      if(items[i].checked){
        app.globalData.measurementsInfo.push(items[i]);
        for(let j=0;j<measurement1.length;j++){
          if(items[i].OperationID===measurement1[j].OperationID){
            app.globalData.measurement1.push(measurement1[j]);
            app.globalData.measurement2.push(measurement2[j]);
            break;
          }
        }
      }
    }
    app.globalData.measurementsInfo=items;
  },
  //全选与反全选
  selectAll : function(e) {
    console.log(e.currentTarget.dataset.text)
    var that = this;
    let checked=false;
    if(e.currentTarget.dataset.text==='true'){
      checked=true;
    }
    var arr = [];   //存放选中id的数组
    for (let i = 0; i < that.data.measurementsInfo.length; i++) {
      that.data.measurementsInfo[i].checked = checked
      // if (that.data.listData[i].checked == true) {
      //   // 全选获取选中的值
      //   arr = arr.concat(that.data.listData[i].code.split(','));
      // }
    }
    that.setData({
      measurementsInfo: that.data.measurementsInfo,
    })
  },
  


})