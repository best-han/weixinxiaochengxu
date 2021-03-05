import event from '../pdffiles/event';
import '../pdffiles/wxPromise.min.js';
const util = require('../pdffiles/util');
const Dialog = require('../zan-ui/dialog/dialog');
import vanDialog from '../van-ui/dialog/dialog';
const request = require('../pdffiles/requests');
import Toast from '../van-ui/toast/toast';

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

let globalData = getApp().globalData;
let tapEvent;

Page({

  data: {
    language: '',
    loading: true,
    // Today's index
    // 0: Sunday ... 6: Saturday
    weekDayIndex: 0,
    // This week's month indices
    monthIndices: [],
    // This week's date indices
    dayIndices: [],
    complement: [],

    showFillInSheetPopup: false,
    selectedDayIndex: 0,
    selectedPeriod: '',
    filledStatus: '',
    statusIndex: 0,
    statuses: ['working', 'waiting', 'studying'],

    showRules: true
  },

  onLoad() {
    this.setLanguage();
    event.on('languageChanged', this, this.setLanguage);

    this.setDates();

    this.fetchShifts();

    this.setComplement();
  },

  getRules() {
    request.getNotices()
      .then(res => {
        if(res.statusCode === 200) {
          let notices = res.data;
          let rules;
          for(let notice of notices) {
            if(notice.subject.includes('值班规则')) {
              rules = notice.content;
              break;
            }
          }
          if(rules) {
            this.setData({
              rules,
              showRules: true
            });
          }
        }
      });
  },

  onPullDownRefresh() {
    this.fetchShifts();
  },

  pullDownRefresh() {
    wx.startPullDownRefresh();
    this.fetchShifts().then(wx.stopPullDownRefresh);
  },

  setComplement() {
    let complement = [];
    for(let i=0; i<6; i++) {
      complement[i] = new Array(6 - i);
    }
    this.setData({
      complement
    });
  },

  setDates() {
    let now = new Date();
    let weekDayIndex = now.getDay();
    let monthIndices = [], dayIndices = [];
    let beforeToday = weekDayIndex+1, afterToday = weekDayIndex;
    while(beforeToday-- > 0) {
      let day = now.addDays(beforeToday - weekDayIndex);
      // 0: Jun., ..., 11: Dec.
      monthIndices[beforeToday] = day.getMonth();
      // 0: 1st, ..., 30: 31th
      dayIndices[beforeToday] = day.getDate() - 1;
    }
    while(++afterToday < 7) {
      let day = now.addDays(afterToday - weekDayIndex);
      monthIndices[afterToday] = day.getMonth();
      dayIndices[afterToday] = day.getDate() - 1;
    }
    this.setData({
      weekDayIndex,
      monthIndices,
      dayIndices
    });
  },

  // Get shifts information
  fetchShifts() {
    return request.getShifts({
      startMonth: this.data.monthIndices[0] + 1,
      startDay: this.data.dayIndices[0] + 1,
      endMonth: this.data.monthIndices[6] + 1,
      endDay: this.data.dayIndices[6] + 1
    }).then(res => {
      if(res.statusCode === 200) {
        this.setData({
          shifts: res.data,
          loading: false,
          scrollTop: this.data.scrollTop || 0,
          scrollLeft: this.data.scrollLeft || 0
        });
      } 
    }).catch(() => {
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 1500);
    }).then(() => {
      this.getRules();
    });
  },

  setLanguage() {
    this.setData({
      language: wx.T.getLanguage()
    });
    this.data.shouldChangeTitle = true;
  },

  onShow() {
    if (this.data.shouldChangeTitle) {
      wx.T.setNavigationBarTitle();
      this.data.shouldChangeTitle = false;
    }
  },

  // Fill in sheet
  fillInSheet(event) {
    let dataset =  event.currentTarget.dataset;
    this.setData({
      selectedDayIndex: dataset.dayIndex,
      selectedPeriod: dataset.period,
      showFillInSheetPopup: true
    });
  },
  submitShift() {
    this.toggleFillInSheetPopup();
    let data = this.data;
    request.addShift(
      globalData.stuId, 
      new Date().getFullYear(),
      data.monthIndices[data.selectedDayIndex] + 1, 
      data.dayIndices[data.selectedDayIndex] + 1,
      data.selectedPeriod === 'morning',
      data.statuses[data.statusIndex]
    ).then(res => {
      if(res.statusCode === 200) {
        util.show(data.language.fillInSheetSuccess, 'success');    
        this.setData({
          loading: true
        });
        this.fetchShifts();
      }
    });
  },
  abandonShift() {
    this.setData({
      showFillInSheetPopup: false
    });
  },
  changeStatus(event) {
    this.setData({
      statusIndex: event.detail.value
    });
  },
  toggleFillInSheetPopup() {
    this.setData({
      showFillInSheetPopup: !this.data.showFillInSheetPopup
    });
  },

  setActions(event) {
    this.setData({
      actions: [
        {name: event.currentTarget.dataset.shiftDetail, disabled: true},
        {name: '➕'}
      ]
    });
  },

  toggleActionChooser() {
    this.setData({
      showActionChooser: !this.data.showActionChooser
    });
  },

  seeDetail(event) {
    this.setActions(event);
    this.toggleActionChooser();
    tapEvent = event;
  },

  onSelectedAction(event) {
    if(event.detail.name === '➕'){
      this.toggleActionChooser();
      this.fillInSheet(tapEvent);
    }
  },

  deleteShift(event) {
    // Cannot delete others' shift
    if(event.currentTarget.dataset.phoneNumber !== globalData.user.phone_number) {
      // See shift detail, add shift if user wants to
      this.seeDetail(event);
      return;
    }

    let data = this.data;
    Dialog({
      title: data.language.deleteShift,
      message: data.language.confirmDeleteShift,
      selector: '#delete-shift-dialog',
      buttons: [
        {
          text: data.language.cancel,
          color: '#ff5811',
          type: 'cancel'
        },
        {
          text: data.language.confirm,
          color: '#49B1F5',
          type: 'confirm'
        }
      ]
    }).then(({type}) => {
      if(type === 'confirm') {
        request.deleteShift(event.currentTarget.dataset.shiftId)
          .then(res => {
            if(res.statusCode === 200) {
              util.show(data.language.deleteShiftSuccess, 'success');    
              this.setData({
                loading: true
              });
              this.fetchShifts();
            }
          });
      }
    });
  },

  saveClickPosition(event) {
    this.data.scrollTop = event.detail.y;
    this.data.scrollLeft = event.detail.x;
  },

  closeRules() {
    this.setData({
      showRules: false
    });
  },
  showRules() {
    this.setData({
      showRules: true
    });
  },

  getHTML() {
    let headHTML = `<head>
      <style>
        html {
          font-family: Baskerville, Georgia, "Liberation Serif", "Kaiti SC", STKaiti, "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "AR PL UKai TW MBE", "AR PL KaitiM GB", KaiTi, KaiTi_GB2312, DFKai-SB, "TW\-Kai", serif;
          background-color: #99d3f9;
        }
        table {
          border-collapse: collapse;
          border: 2px solid rgb(200,200,200);
          letter-spacing: 1px;
          font-size: 0.8rem;
          background: linear-gradient(to right, #5d8ef1, #25b7c4);
          margin-top: 3em;
          width: 90%;
          color: white;
        }
        td, th {
          border: 1px solid rgb(190,190,190);
          padding: 10px 20px;
        }
        td {
          text-align: center;
        }
        caption {
          padding: 10px;
        }
        .working {
          background: #66BB6A;
        }
        
        .waiting {
          background: #ef7a82;
        }
        
        .studying {
          background: #99d3f9;
        }
        .day-date+tr {
          font-weight: bold;
        }
      </style>
    </head>`;

    let tableOpeningHTML = `<body>
      <center><table>
    `;
    let tableClosingHTML = `</table></center>
    <body>
    `;

    let sheetHTML = `<tr>
      <th>${this.data.language.sheet}</th>
      <th>${this.data.language.morning}</th>
      <th>${this.data.language.afternoon}</th>
    </tr>`;

    for (let dayIndex = 0; dayIndex < this.data.shifts.length; dayIndex++) {
      // For empty day
      if(this.data.shifts[dayIndex][0].length === 0 && this.data.shifts[dayIndex][1].length === 0) {
        sheetHTML += `<tr class="day day-date">
          <th>${this.data.language.months[this.data.monthIndices[dayIndex]] + ' ' + this.data.language.days[this.data.dayIndices[dayIndex]] + ' ' + this.data.language.weekDays[dayIndex]}</th>
          <td class="morning">&nbsp;</td>
          <td class="afternoon">&nbsp;</td>
        </tr>`;
      }
      
      // Morning shifts less than afternoon shifts
      else if(this.data.shifts[dayIndex][0].length < this.data.shifts[dayIndex][1].length) {
        let dayRowspan = this.data.shifts[dayIndex][1].length;
        let commonSpan = this.data.shifts[dayIndex][0].length;

        sheetHTML += `<tr class="day day-date">
          <th rowspan="${dayRowspan+1}">${this.data.language.months[this.data.monthIndices[dayIndex]] + ' ' + this.data.language.days[this.data.dayIndices[dayIndex]] + ' ' + this.data.language.weekDays[dayIndex]}</th>
        </tr>`;
        // Morning shifts and equal size afternoon shifts
        for(let i=0; i<commonSpan; i++) {
          let morningGuide = this.data.shifts[dayIndex][0][i];
          let afternoonGuide = this.data.shifts[dayIndex][1][i];
          sheetHTML += `<tr><td class="morning ${morningGuide.status}">${morningGuide.name + ' ' + morningGuide.phone_number + ' ' + morningGuide.language + ' ' + morningGuide.session}</td>
          <td class="afternoon ${afternoonGuide.status}">${afternoonGuide.name + ' ' + afternoonGuide.phone_number + ' ' + afternoonGuide.language + ' ' + afternoonGuide.session}</td></tr>`;
        }
        // Extra afternoon shifts
        for(let i=commonSpan; i<dayRowspan; i++) {
          let afternoonGuide = this.data.shifts[dayIndex][1][i];
          sheetHTML += `<tr><td class="morning"></td>
          <td class="afternoon ${afternoonGuide.status}">${afternoonGuide.name + ' ' + afternoonGuide.phone_number + ' ' + afternoonGuide.language + ' ' + afternoonGuide.session}</td></tr>`;
        }
      }
      // Morning shifts more than afternoon shifts
      else {
        let dayRowspan = this.data.shifts[dayIndex][0].length;
        let commonSpan = this.data.shifts[dayIndex][1].length;

        sheetHTML += `<tr class="day day-date">
          <th rowspan="${dayRowspan+1}">${this.data.language.months[this.data.monthIndices[dayIndex]] + ' ' + this.data.language.days[this.data.dayIndices[dayIndex]] + ' ' + this.data.language.weekDays[dayIndex]}</th>
        </tr>`;
        // Morning shifts and equal size afternoon shifts
        for(let i=0; i<commonSpan; i++) {
          let morningGuide = this.data.shifts[dayIndex][0][i];
          let afternoonGuide = this.data.shifts[dayIndex][1][i];
          sheetHTML += `<tr><td class="morning ${morningGuide.status}">${morningGuide.name + ' ' + morningGuide.phone_number + ' ' + morningGuide.language + ' ' + morningGuide.session}</td>
          <td class="afternoon ${afternoonGuide.status}">${afternoonGuide.name + ' ' + afternoonGuide.phone_number + ' ' + afternoonGuide.language + ' ' + afternoonGuide.session}</td></tr>`;
        }
        // Extra morning shifts
        for(let i=commonSpan; i<dayRowspan; i++) {
          let morningGuide = this.data.shifts[dayIndex][0][i];
          sheetHTML += `<tr><td class="morning ${morningGuide.status}">${morningGuide.name + ' ' + morningGuide.phone_number + ' ' + morningGuide.language + ' ' + morningGuide.session}</td>
          <td class="afternoon"></td></tr>`;
        }
      }
    }

    let html = headHTML + tableOpeningHTML + sheetHTML + tableClosingHTML;
    return html;
  },

  getFilePath() {
    let now = new Date();
    let thisMonday = now.addDays(1 - now.getDay());
    thisMonday.setHours(0, 0, 0);
    let filename = util.getDateString(thisMonday);
    let filePath = `${wx.env.USER_DATA_PATH}/${this.data.language.sheet}@${filename}.pdf`;
    return filePath;
  },

  saveToPDF() {
    let html = this.getHTML();
    let filePath = this.getFilePath();
    console.log('saveToPDF');
    request.getPDFByHTML(html)
      .then(res => {
        let fileManager = wx.getFileSystemManager();
        
        fileManager.writeFile({
          filePath: filePath,
          data: res.data,
          encoding: 'binary',
          success: (result)=>{
            if(result.errMsg === 'writeFile:ok'){
              Toast.clear();
              vanDialog.confirm({
                title: this.data.language.saved,
                message: this.data.language.willYouOpenIt,
                confirmButtonText: this.data.language.confirm,
                cancelButtonText: this.data.language.cancel
              }).then(this.openPDF);
            } else {
              util.show(this.data.language.savingFailed, 'fail');  
            }
          },
          fail: () => {
            Toast.clear();
            util.show(this.data.language.savingFailed, 'fail');
          }
        });
      });
  },

  openPDF() {
    wx.openDocument({
      filePath: this.getFilePath(),
      fileType: 'pdf',
      fail: () => {
        util.show(this.data.language.fileNotExists, 'fail');
      }
    });
  },

  toggleInfo() {
    vanDialog.alert({
      title: this.data.language.aboutFile,
      message: this.data.language.pdfFileDeatil
    });
  }
});