function init() {
    mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));
    mdc.topAppBar.MDCTopAppBar.attachTo(document.querySelector('.mdc-top-app-bar'));

    let input = document.getElementById('my-input');
    input.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            e.preventDefault();
            document.getElementById('my-button').click();
        }
    })
}

init();

const snackBar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));
const textField = mdc.textField.MDCTextField.attachTo(document.querySelector('.mdc-text-field'));

const qrCode = document.getElementById('my-qr-code');
const infoDiv = document.getElementById('info-div');
const remainTime = document.getElementById('remain-time');

let signCode = null;
let qrCodeIntervalId = null;
let infoIntervalId = null;

function openSnackBar(msg) {
    if (snackBar.isOpen) {
        snackBar.close();
    }
    snackBar.labelText = msg;
    snackBar.open();
}


function clearMyInterval() {
    if (qrCodeIntervalId) {
        clearInterval(qrCodeIntervalId);
        qrCodeIntervalId = null;
    }
    if (infoIntervalId) {
        clearInterval(infoIntervalId);
        infoIntervalId = null;
    }
}

function refreshCode(aid, enc) {
    let signCodeUrl = 'https://mobilelearn.chaoxing.com/newsign/signDetail?' +
        'activePrimaryId=' + aid + '&type=1';
    let httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', signCodeUrl, true);
    httpRequest.onreadystatechange = () => {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            let obj = JSON.parse(httpRequest.responseText);
            let source = obj['source'];

            if (obj['signCode'] != signCode) {
                signCode = obj['signCode'];
                console.log('Refresh. Code: ' + signCode);
                openSnackBar('已刷新二维码');

                let signString = 'url=SIGNIN%3A' +
                    'aid%3D' + aid + '%26' +
                    'source%3D' + source + '%26' +
                    'Code%3D' + signCode + '%26' +
                    'enc%3D' + enc;
                let qrCodeUrl = 'http://qcode.16q.cn/code.jspx?w=500&h=500&e=h&' + signString;
                qrCode.src = qrCodeUrl;
            }

            if (!infoIntervalId) {
                infoDiv.style.visibility = 'visible';
                let endTime = obj['endTime']['time'];
                refreshInfo(endTime);
                infoIntervalId = setInterval(() => {
                    refreshInfo(endTime);
                }, 1000)
            }
        }
    }
    httpRequest.send();
}

function refreshInfo(endTime) {
    let nowDate = new Date();
    let nowTime = nowDate.getTime();
    let detTime = parseInt((endTime - nowTime) / 1000);

    if (detTime < 0) {
        clearMyInterval();
        remainTime.innerText = '已截止';
        return;
    }

    let hour = parseInt(detTime / 3600).toString().padStart(2, '0');
    detTime %= 3600;
    let min = parseInt(detTime / 60).toString().padStart(2, '0');
    detTime %= 60;
    let sec = parseInt(detTime).toString().padStart(2, '0');

    let timeStr = hour + ':' + min + ':' + sec;
    remainTime.innerText = timeStr;
}

function generate() {
    let text = textField.value.trim();
    if (text.length == 0) {
        openSnackBar('输入不能为空');
        return;
    }
    if (!text.startsWith('SIGNIN:')) {
        openSnackBar('输入格式有误');
        return;
    }

    text = text.slice(7);
    let argsStrings = text.split('&');
    let args = {};
    for (s of argsStrings) {
        let arg = s.split('=');
        args[arg[0]] = arg[1];
    }

    let aid = args['aid'];
    let enc = args['enc'];
    if (!(aid && enc)) {
        openSnackBar('无法从输入获取参数');
        return;
    }

    clearMyInterval();
    infoDiv.style.visibility = 'hidden';

    openSnackBar('已开始刷新');
    refreshCode(aid, enc);
    qrCodeIntervalId = setInterval(() => {
        refreshCode(aid, enc);
    }, 2000)
}
