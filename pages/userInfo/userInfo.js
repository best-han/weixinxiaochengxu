var app = getApp();
const log = require('../../log.js')

Page({
  data: {
    versionNo: app.globalData.versionNo,
    show:false,//控制下拉列表的显示隐藏，false隐藏、true显示
    selectData:['请选择','Vt','V20','Vt和V20'],//下拉列表的数据
    index:0,//选择的下拉列表下标
    checkboxItems: [
      { name: 'USA', value: '我已了解并阅读了' },
    ],
    userinfo:{},
  },
  // 点击下拉显示框
  selectTap(){
    this.setData({
      show: !this.data.show
    });
  },
  // 点击下拉列表
  optionTap(e){
    let Index=e.currentTarget.dataset.index;//获取点击的下拉列表的下标
    //1：Vt  2：V20  3：Vt和V20
    this.setData({
      index:Index,
      show:!this.data.show
    });
    //设置打印体积
    app.globalData.printVolume=Index;
  },

// 表单
  edituser: function (e) {
    console.log(e.detail.value);
    var formdata=e.detail.value;
    let userinfo = {'uname':formdata.uname,'address':formdata.address,'tel':formdata.tel,'code':formdata.code,'info':formdata.info,'printVolume':this.data.index};
    wx.setStorageSync('userinfo', userinfo)
    wx.showToast({
      title: '保存成功',
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      let userinfo=wx.getStorageSync('userinfo');
      this.setData({
        versionNo : app.globalData.versionNo,
        userinfo: userinfo,
        index: userinfo.printVolume
      })
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

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  }
})